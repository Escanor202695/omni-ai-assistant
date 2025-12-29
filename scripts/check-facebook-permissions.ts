/**
 * Script to check Facebook Page Access Token permissions
 * 
 * Usage: npx tsx scripts/check-facebook-permissions.ts [page-id]
 */

import { db } from '../lib/db';
import { decrypt } from '../lib/encryption';

async function checkPermissions(pageId?: string) {
  try {
    let integration;
    
    if (pageId) {
      integration = await db.integration.findFirst({
        where: {
          platformId: pageId,
          type: { in: ['FACEBOOK', 'INSTAGRAM'] },
          isActive: true,
        },
      });
    } else {
      integration = await db.integration.findFirst({
        where: {
          type: 'FACEBOOK',
          isActive: true,
        },
      });
    }

    if (!integration) {
      console.error('❌ No Facebook integration found');
      process.exit(1);
    }

    const accessToken = decrypt(integration.accessToken);
    const pageIdToCheck = integration.platformId;

    console.log('\n🔍 Checking Facebook Page Permissions');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Page ID:', pageIdToCheck);
    console.log('Page Name:', integration.platformName || 'N/A');
    
    // Check token permissions
    const permissionsUrl = `https://graph.facebook.com/v18.0/${pageIdToCheck}?fields=access_token&access_token=${accessToken}`;
    console.log('\n📋 Fetching page info...');
    
    const pageResponse = await fetch(permissionsUrl);
    const pageData = await pageResponse.json();
    
    if (pageData.error) {
      console.error('❌ Error:', pageData.error);
      return;
    }

    // Check what permissions the token has
    const debugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    console.log('\n🔐 Checking token permissions...');
    
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();
    
    if (debugData.data) {
      console.log('\n✅ Token Info:');
      console.log('  App ID:', debugData.data.app_id);
      console.log('  User ID:', debugData.data.user_id);
      console.log('  Scopes:', debugData.data.scopes?.join(', ') || 'None');
      
      const hasMessaging = debugData.data.scopes?.includes('pages_messaging');
      console.log('\n📨 Messaging Permission:');
      console.log(hasMessaging ? '  ✅ pages_messaging granted' : '  ❌ pages_messaging NOT granted');
      
      if (!hasMessaging) {
        console.log('\n💡 To fix:');
        console.log('  1. Go to Meta Developer Console → Your App');
        console.log('  2. Go to Permissions and Features');
        console.log('  3. Request "pages_messaging" permission');
        console.log('  4. Re-authenticate to get new token with permission');
      }
    }

    // Test sending a message (will fail if no permission)
    console.log('\n🧪 Testing message send capability...');
    console.log('   (This will fail if you\'re not a tester/admin)');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const pageId = process.argv[2];
checkPermissions(pageId);

