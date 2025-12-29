/**
 * Script to get and decrypt integration tokens
 * 
 * Usage: npx tsx scripts/get-integration-token.ts [integration-id]
 */

import { db } from '../lib/db';
import { decrypt } from '../lib/encryption';

async function getIntegrationToken(integrationId?: string) {
  try {
    let integration;

    if (integrationId) {
      integration = await db.integration.findUnique({
        where: { id: integrationId },
        include: { business: true },
      });
    } else {
      // Get first active WhatsApp integration
      integration = await db.integration.findFirst({
        where: {
          type: 'WHATSAPP',
          isActive: true,
        },
        include: { business: true },
      });
    }

    if (!integration) {
      console.error('❌ No integration found');
      console.log('\nAvailable integrations:');
      const all = await db.integration.findMany({
        select: {
          id: true,
          type: true,
          platformId: true,
          platformName: true,
          isActive: true,
          business: {
            select: { name: true },
          },
        },
      });
      console.table(all);
      process.exit(1);
    }

    console.log('\n📋 Integration Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', integration.id);
    console.log('Type:', integration.type);
    console.log('Business:', integration.business.name);
    console.log('Platform ID:', integration.platformId);
    console.log('Platform Name:', integration.platformName || 'N/A');
    console.log('Status:', integration.isActive ? '✅ Active' : '❌ Inactive');

    // Decrypt token
    try {
      const decryptedToken = decrypt(integration.accessToken);
      console.log('\n🔑 Decrypted Access Token:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(decryptedToken);
      console.log('\n📱 Phone Number ID (for API calls):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(integration.platformId);
      console.log('\n💡 Use these in your curl command or test script');
    } catch (error: any) {
      console.error('\n❌ Failed to decrypt token:', error.message);
      console.error('   → Check that ENCRYPTION_KEY is correct');
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

const integrationId = process.argv[2];
getIntegrationToken(integrationId);

