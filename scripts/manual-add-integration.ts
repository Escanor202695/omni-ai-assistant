/**
 * Manual script to add an integration (for testing only)
 * 
 * Usage:
 * npx tsx scripts/manual-add-integration.ts
 * 
 * This will prompt you for:
 * - Business ID (or use first business)
 * - Integration type (WHATSAPP, INSTAGRAM, FACEBOOK)
 * - Access token (from Meta)
 * - Phone number ID or Page ID
 */

import { db } from '../lib/db';
import { encrypt } from '../lib/encryption';
import { IntegrationType } from '@prisma/client';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function main() {
  try {
    console.log('🔧 Manual Integration Setup (Testing Only)\n');

    // Get business
    const businesses = await db.business.findMany({ take: 5 });
    if (businesses.length === 0) {
      console.error('❌ No businesses found. Create a business first.');
      process.exit(1);
    }

    console.log('Available businesses:');
    businesses.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.name} (${b.id})`);
    });

    const businessChoice = await question('\nSelect business number (or press Enter for first): ');
    const businessIndex = businessChoice ? parseInt(businessChoice) - 1 : 0;
    const business = businesses[businessIndex];

    if (!business) {
      console.error('❌ Invalid business selection');
      process.exit(1);
    }

    console.log(`\n✅ Selected: ${business.name}\n`);

    // Get integration type
    const typeInput = await question('Integration type (whatsapp/instagram/facebook): ');
    const type = typeInput.toUpperCase() as IntegrationType;

    if (!['WHATSAPP', 'INSTAGRAM', 'FACEBOOK'].includes(type)) {
      console.error('❌ Invalid type. Must be whatsapp, instagram, or facebook');
      process.exit(1);
    }

    // Get access token
    const accessToken = await question('Access token (from Meta): ');
    if (!accessToken) {
      console.error('❌ Access token required');
      process.exit(1);
    }

    // Get platform ID
    const platformIdLabel = type === 'WHATSAPP' ? 'Phone Number ID' : 'Page ID';
    const platformId = await question(`${platformIdLabel}: `);
    if (!platformId) {
      console.error(`❌ ${platformIdLabel} required`);
      process.exit(1);
    }

    // Get platform name (optional)
    const platformName = await question('Platform name (optional, press Enter to skip): ');

    // Encrypt token
    const encryptedToken = encrypt(accessToken);

    // Create integration
    const integration = await db.integration.upsert({
      where: {
        businessId_type_platformId: {
          businessId: business.id,
          type,
          platformId,
        },
      },
      create: {
        businessId: business.id,
        type,
        accessToken: encryptedToken,
        platformId,
        platformName: platformName || null,
        isActive: true,
        metadata: {},
      },
      update: {
        accessToken: encryptedToken,
        platformName: platformName || null,
        isActive: true,
      },
    });

    console.log('\n✅ Integration created/updated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ID:', integration.id);
    console.log('Type:', integration.type);
    console.log('Platform ID:', integration.platformId);
    console.log('Status: Active');
    console.log('\n💡 You can now use: npx tsx scripts/get-integration-token.ts');

    rl.close();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

main();

