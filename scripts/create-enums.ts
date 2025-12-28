import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating enum types...');
  
  // Create all enum types if they don't exist
  const enums = [
    {
      name: 'UserRole',
      values: ['SUPER_ADMIN', 'BUSINESS_OWNER', 'TEAM_MEMBER'],
    },
    {
      name: 'IntegrationType',
      values: ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'VAPI', 'GOOGLE_CALENDAR', 'EMAIL'],
    },
    {
      name: 'Industry',
      values: ['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER'],
    },
    {
      name: 'SubscriptionTier',
      values: ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'],
    },
    {
      name: 'SubscriptionStatus',
      values: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'],
    },
    {
      name: 'Channel',
      values: ['WEBCHAT', 'VOICE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'SMS', 'EMAIL'],
    },
    {
      name: 'ConversationStatus',
      values: ['ACTIVE', 'RESOLVED', 'ESCALATED', 'ABANDONED'],
    },
    {
      name: 'MessageRole',
      values: ['USER', 'ASSISTANT', 'SYSTEM', 'HUMAN'],
    },
    {
      name: 'AppointmentStatus',
      values: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELED', 'NO_SHOW'],
    },
    {
      name: 'KnowledgeDocType',
      values: ['FAQ', 'SERVICE', 'POLICY', 'WEBSITE', 'DOCUMENT'],
    },
  ];

  for (const enumDef of enums) {
    const values = enumDef.values.map(v => `'${v}'`).join(', ');
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "${enumDef.name}" AS ENUM (${values});
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log(`✅ ${enumDef.name} enum created/verified`);
  }

  console.log('\n✅ All enum types created successfully!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

