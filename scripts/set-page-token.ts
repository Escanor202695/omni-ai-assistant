/**
 * Script to directly set a page access token for an integration
 * 
 * Usage: npx tsx scripts/set-page-token.ts [page-access-token] [page-id]
 */

import { db } from '../lib/db';
import { encrypt } from '../lib/encryption';

async function setPageToken(pageAccessToken: string, pageId: string) {
  try {
    // Find the integration
    const integration = await db.integration.findFirst({
      where: {
        platformId: pageId,
        type: { in: ['FACEBOOK', 'INSTAGRAM'] },
      },
    });

    if (!integration) {
      console.error(`❌ No integration found for page ${pageId}`);
      console.log('\n💡 Available integrations:');
      const all = await db.integration.findMany({
        where: { type: { in: ['FACEBOOK', 'INSTAGRAM'] } },
        select: { id: true, platformId: true, platformName: true },
      });
      console.table(all);
      process.exit(1);
    }

    // Verify the token works
    console.log('🔍 Verifying token...');
    const verifyResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=name&access_token=${pageAccessToken}`
    );
    const verifyData = await verifyResponse.json();
    
    if (verifyData.error) {
      console.error('❌ Invalid token:', verifyData.error);
      process.exit(1);
    }

    console.log(`✅ Token verified for page: ${verifyData.name}`);

    // Update with page access token
    const encryptedToken = encrypt(pageAccessToken);
    
    await db.integration.update({
      where: { id: integration.id },
      data: {
        accessToken: encryptedToken,
        platformName: verifyData.name,
        isActive: true,
      },
    });

    console.log('\n✅ Updated integration!');
    console.log('   Page:', verifyData.name);
    console.log('   Page ID:', pageId);
    console.log('   Token type: Page Access Token');
    console.log('\n💡 Now try sending a message to your Facebook page!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const pageToken = process.argv[2];
const pageId = process.argv[3] || '105115125867248'; // Default to Instaquirk

if (!pageToken) {
  console.error('❌ Usage: npx tsx scripts/set-page-token.ts [page-access-token] [page-id]');
  process.exit(1);
}

setPageToken(pageToken, pageId);

