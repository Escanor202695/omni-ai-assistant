import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';

/**
 * GET /api/integrations/meta/connect
 * Start Meta OAuth flow
 * Query params: ?type=whatsapp|instagram|facebook
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type')?.toUpperCase();

    if (!type || !['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be whatsapp, instagram, or facebook' },
        { status: 400 }
      );
    }

    const appId = process.env.META_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/meta/callback`;

    if (!appId) {
      return NextResponse.json(
        { error: 'META_APP_ID not configured' },
        { status: 500 }
      );
    }

    // Define scopes based on type
    const scopes: Record<string, string> = {
      WHATSAPP: 'whatsapp_business_management,whatsapp_business_messaging',
      INSTAGRAM: 'instagram_basic,instagram_manage_messages,pages_messaging,pages_read_engagement',
      FACEBOOK: 'pages_messaging,pages_manage_metadata,pages_read_engagement',
    };

    // Build OAuth URL
    const state = Buffer.from(
      JSON.stringify({ businessId: session.businessId, type })
    ).toString('base64url');

    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scopes[type]);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');

    // Redirect to Meta OAuth
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error starting Meta OAuth:', error);
    return NextResponse.json(
      { error: 'Failed to start OAuth flow' },
      { status: 500 }
    );
  }
}


