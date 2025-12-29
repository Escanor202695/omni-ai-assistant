/**
 * Script to connect all Facebook Pages from an access token
 * 
 * Usage: npx tsx scripts/connect-all-pages.ts [access-token] [businessId]
 */

import { db } from '../lib/db';
import { encrypt } from '../lib/encryption';
import { IntegrationType } from '@prisma/client';

async function connectAllPages(accessToken: string, businessId: string) {
  try {
    console.log('Fetching all pages...\n');

    // Get all pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`
    );

    if (!pagesResponse.ok) {
      console.error('❌ Failed to fetch pages');
      const error = await pagesResponse.json();
      console.error(JSON.stringify(error, null, 2));
      process.exit(1);
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      console.log('❌ No pages found');
      process.exit(1);
    }

    console.log(`Found ${pages.length} pages:\n`);
    pages.forEach((page: any, i: number) => {
      console.log(`${i + 1}. ${page.name} (ID: ${page.id})`);
    });

    console.log('\nConnecting all pages...\n');

    // Save each page as a separate integration
    for (const page of pages) {
      // Use page access token, not user access token!
      const encryptedToken = encrypt(page.access_token);

      // Subscribe page to webhook automatically
      try {
        const subscribeResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`,
          {
            method: 'POST',
            body: JSON.stringify({
              subscribed_fields: ['messages', 'messaging_postbacks', 'messaging_optins'],
              access_token: page.access_token,
            }),
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (subscribeResponse.ok) {
          console.log(`   📡 Subscribed to webhook`);
        } else {
          const error = await subscribeResponse.json();
          console.log(`   ⚠️ Webhook subscription failed:`, error.error?.message || 'Unknown error');
        }
      } catch (subError: any) {
        console.log(`   ⚠️ Could not subscribe to webhook:`, subError.message);
      }

      const integration = await db.integration.upsert({
        where: {
          businessId_type_platformId: {
            businessId,
            type: IntegrationType.FACEBOOK,
            platformId: page.id,
          },
        },
        create: {
          businessId,
          type: IntegrationType.FACEBOOK,
          accessToken: encryptedToken,
          platformId: page.id,
          platformName: page.name,
          isActive: true,
          metadata: {
            pageId: page.id,
            pageName: page.name,
          },
        },
        update: {
          accessToken: encryptedToken,
          platformName: page.name,
          isActive: true,
        },
      });

      console.log(`✅ Connected: ${page.name}`);
    }

    console.log(`\n✅ Successfully connected ${pages.length} pages!`);
    console.log('\n💡 Now all these pages can receive messages through the webhook');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const accessToken = process.argv[2];
const businessId = process.argv[3];

if (!accessToken || !businessId) {
  console.error('Usage: npx tsx scripts/connect-all-pages.ts [access-token] [businessId]');
  console.error('\nTo get access token from existing integration:');
  console.error('  npx tsx scripts/get-integration-token.ts');
  console.error('\nExample:');
  console.error('  npx tsx scripts/connect-all-pages.ts EAAKp... cmjpw5zfh0000olxcgxu2imog');
  process.exit(1);
}

connectAllPages(accessToken, businessId);

