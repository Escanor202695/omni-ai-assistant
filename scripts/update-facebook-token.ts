/**
 * Script to update Facebook integration with page access token
 * 
 * Usage: npx tsx scripts/update-facebook-token.ts [user-access-token] [page-id]
 */

import { db } from '../lib/db';
import { encrypt } from '../lib/encryption';

async function updateToken(userAccessToken: string, pageId?: string) {
  try {
    // Get all pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    );

    if (!pagesResponse.ok) {
      const error = await pagesResponse.json();
      console.error('❌ Failed to fetch pages:', error);
      process.exit(1);
    }

    const pagesData = await pagesResponse.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      console.error('❌ No pages found');
      process.exit(1);
    }

    console.log('\n📋 Found pages:');
    pages.forEach((page: any, i: number) => {
      console.log(`  ${i + 1}. ${page.name} (ID: ${page.id})`);
    });

    // Find the page to update
    let targetPage;
    if (pageId) {
      targetPage = pages.find((p: any) => p.id === pageId);
      if (!targetPage) {
        console.error(`❌ Page ${pageId} not found`);
        process.exit(1);
      }
    } else {
      targetPage = pages[0];
      console.log(`\n📝 Using first page: ${targetPage.name}`);
    }

    // Find the integration
    const integration = await db.integration.findFirst({
      where: {
        platformId: targetPage.id,
        type: { in: ['FACEBOOK', 'INSTAGRAM'] },
      },
    });

    if (!integration) {
      console.error(`❌ No integration found for page ${targetPage.id}`);
      console.log('\n💡 Available integrations:');
      const all = await db.integration.findMany({
        where: { type: { in: ['FACEBOOK', 'INSTAGRAM'] } },
        select: { id: true, platformId: true, platformName: true },
      });
      console.table(all);
      process.exit(1);
    }

    // Update with page access token
    const encryptedPageToken = encrypt(targetPage.access_token);
    
    await db.integration.update({
      where: { id: integration.id },
      data: {
        accessToken: encryptedPageToken,
        platformName: targetPage.name,
        isActive: true,
      },
    });

    console.log('\n✅ Updated integration!');
    console.log('   Page:', targetPage.name);
    console.log('   Page ID:', targetPage.id);
    console.log('   Token type: Page Access Token');
    console.log('\n💡 Now try sending a message to your Facebook page!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const userToken = process.argv[2];
const pageId = process.argv[3];

if (!userToken) {
  console.error('❌ Usage: npx tsx scripts/update-facebook-token.ts [user-access-token] [page-id]');
  console.log('\n💡 To get user access token:');
  console.log('   1. Go to https://developers.facebook.com/tools/explorer/');
  console.log('   2. Select your app');
  console.log('   3. Get token with permissions: pages_show_list, pages_messaging');
  console.log('   4. Copy the token and use it here');
  process.exit(1);
}

updateToken(userToken, pageId);

