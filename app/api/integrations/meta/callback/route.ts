import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { encrypt } from '@/lib/encryption';
import { IntegrationType } from '@prisma/client';

/**
 * GET /api/integrations/meta/callback
 * Handle Meta OAuth callback
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=oauth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=missing_params`);
    }

    // Decode state
    let stateData: { businessId: string; type: string };
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=invalid_state`);
    }

    // Verify session matches state
    const session = await getServerSession();
    if (!session || session.businessId !== stateData.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/meta/callback`;

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: 'Meta app not configured' },
        { status: 500 }
      );
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
        `client_id=${appId}&` +
        `client_secret=${appSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`,
      { method: 'GET' }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json().catch(() => ({}));
      console.error('Token exchange error:', error);
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=no_token`);
    }

    // Get long-lived token (optional, but recommended)
    // For now, we'll use the short-lived token and handle refresh later

    // Get platform information based on type
    let platformId: string;
    let platformName: string | null = null;
    let metadata: any = {};
    let pageAccessToken: string | null = null; // Store page access token for Facebook/Instagram

    if (stateData.type === 'WHATSAPP') {
      // Get WhatsApp Business Account ID
      const wabaResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/businesses?access_token=${accessToken}`
      );
      const wabaData = await wabaResponse.json();
      console.log('WABA Response:', JSON.stringify(wabaData, null, 2));
      
      if (wabaResponse.ok && wabaData.data?.[0]?.id) {
        const phoneResponse = await fetch(
          `https://graph.facebook.com/v18.0/${wabaData.data[0].id}/phone_numbers?access_token=${accessToken}`
        );
        const phoneData = await phoneResponse.json();
        console.log('Phone Response:', JSON.stringify(phoneData, null, 2));
        
        if (phoneResponse.ok && phoneData.data?.[0]?.id) {
          platformId = phoneData.data[0].id;
          platformName = phoneData.data[0].display_phone_number || null;
          metadata = {
            phoneNumber: phoneData.data[0].display_phone_number,
            wabaId: wabaData.data[0].id,
          };
        }
      }
    } else if (stateData.type === 'INSTAGRAM' || stateData.type === 'FACEBOOK') {
      // Get pages
      const pagesResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
      );
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        console.log('Pages Response:', JSON.stringify(pagesData, null, 2));
        
        // Save only the FIRST page (simpler - one page per connection)
        if (pagesData.data && Array.isArray(pagesData.data) && pagesData.data.length > 0) {
          // Delete any existing Facebook/Instagram integrations for this business
          await db.integration.deleteMany({
            where: {
              businessId: stateData.businessId,
              type: { in: ['FACEBOOK', 'INSTAGRAM'] },
            },
          });
          
          // Use the first page
          const page = pagesData.data[0];
          const pageToken = page.access_token;
          const encryptedPageToken = encrypt(pageToken);
          
          platformId = page.id;
          platformName = page.name || null;
          pageAccessToken = pageToken;
          
          // Automatically subscribe page to webhook for 'messages' field
          try {
            const subscribeResponse = await fetch(
              `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins'],
                  access_token: pageToken,
                }),
              }
            );
            
            if (subscribeResponse.ok) {
              console.log(`✅ Subscribed page ${page.name} to webhook`);
            } else {
              const error = await subscribeResponse.json();
              console.error(`Failed to subscribe page ${page.name} to webhook:`, error);
            }
          } catch (subError) {
            console.error(`Error subscribing page ${page.name} to webhook:`, subError);
          }
          
          metadata = {
            pageId: page.id,
            pageName: page.name,
            allPages: pagesData.data.map((p: any) => ({
              id: p.id,
              name: p.name,
            })),
          };
        }
      }
    }

    if (!platformId) {
      return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=no_platform_id`);
    }

    // Use page access token for Facebook/Instagram, user token for WhatsApp
    const tokenToStore = pageAccessToken || accessToken;
    
    // Encrypt tokens
    const encryptedAccessToken = encrypt(tokenToStore);

    // Save or update integration
    await db.integration.upsert({
      where: {
        businessId_type_platformId: {
          businessId: stateData.businessId,
          type: stateData.type as IntegrationType,
          platformId,
        },
      },
      create: {
        businessId: stateData.businessId,
        type: stateData.type as IntegrationType,
        accessToken: encryptedAccessToken,
        platformId,
        platformName,
        metadata,
        isActive: true,
      },
      update: {
        accessToken: encryptedAccessToken,
        platformName,
        metadata,
        isActive: true,
      },
    });

    // Redirect to integrations page with success
    // Use absolute URL to avoid hash issues
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?success=connected`);
  } catch (error: any) {
    console.error('Error in Meta OAuth callback:', error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/dashboard/integrations?error=callback_failed`);
  }
}


