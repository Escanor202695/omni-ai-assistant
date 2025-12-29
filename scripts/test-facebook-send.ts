/**
 * Script to test sending a Facebook message
 * 
 * Usage: npx tsx scripts/test-facebook-send.ts [page-id] [recipient-id]
 */

import { db } from '../lib/db';
import { decrypt } from '../lib/encryption';
import { sendFacebookMessage } from '../lib/integrations/meta';

async function testSend(pageId?: string, recipientId?: string) {
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
    const pageIdToUse = integration.platformId;

    if (!recipientId) {
      console.error('❌ Recipient ID required');
      console.log('\n💡 To get recipient ID:');
      console.log('   1. Send a message to your Facebook page');
      console.log('   2. Check webhook logs - sender ID will be in the payload');
      console.log('   3. Or use: npx tsx scripts/get-integration-token.ts');
      process.exit(1);
    }

    console.log('\n📤 Testing Facebook Message Send');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Page ID:', pageIdToUse);
    console.log('Page Name:', integration.platformName || 'N/A');
    console.log('Recipient ID:', recipientId);
    console.log('Message: "Hello! This is a test message from the AI assistant."');
    
    try {
      const result = await sendFacebookMessage({
        accessToken,
        pageId: pageIdToUse,
        recipientId,
        text: 'Hello! This is a test message from the AI assistant.',
      });
      
      console.log('\n✅ Message sent successfully!');
      console.log('Response:', JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.error('\n❌ Failed to send message:');
      console.error(error.message);
      
      if (error.message.includes('OAuthException')) {
        console.log('\n💡 Common causes:');
        console.log('   1. App is in development mode - recipient must be a tester/admin');
        console.log('   2. 24-hour messaging window expired');
        console.log('   3. Recipient needs to message the page first');
        console.log('\n🔧 To fix:');
        console.log('   1. Go to Meta Developer Console → Roles → Roles');
        console.log('   2. Add the recipient as a Tester');
        console.log('   3. Or submit app for review to go live');
      }
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const pageId = process.argv[2];
const recipientId = process.argv[3];
testSend(pageId, recipientId);

