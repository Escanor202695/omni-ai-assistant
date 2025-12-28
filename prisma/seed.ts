import { PrismaClient, UserRole } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

/**
 * Seed script to create the first super admin user
 * 
 * Usage:
 * 1. Set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in .env
 * 2. Create user in Supabase Auth first (via dashboard or API)
 * 3. Get the supabaseUserId from Supabase
 * 4. Run: npx tsx prisma/seed.ts
 * 
 * Or set SUPABASE_USER_ID env var directly if you know it
 */

async function main() {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const supabaseUserId = process.env.SUPER_ADMIN_SUPABASE_USER_ID;

  if (!adminEmail) {
    console.error('❌ SUPER_ADMIN_EMAIL environment variable is required');
    console.log('\nSet in .env:');
    console.log('SUPER_ADMIN_EMAIL=admin@yourcompany.com');
    console.log('SUPER_ADMIN_SUPABASE_USER_ID=supabase-user-id-here');
    process.exit(1);
  }

  if (!supabaseUserId) {
    console.error('❌ SUPER_ADMIN_SUPABASE_USER_ID environment variable is required');
    console.log('\nTo get the Supabase user ID:');
    console.log('1. Create user in Supabase Auth dashboard');
    console.log('2. Or use Supabase API to create user');
    console.log('3. Copy the user ID (UUID)');
    console.log('\nSet in .env:');
    console.log('SUPER_ADMIN_SUPABASE_USER_ID=your-supabase-user-id');
    process.exit(1);
  }

  // Check if super admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { supabaseUserId },
        { role: UserRole.SUPER_ADMIN },
      ],
    },
  });

  if (existingAdmin) {
    if (existingAdmin.role === UserRole.SUPER_ADMIN) {
      console.log('✅ Super admin already exists:', existingAdmin.email);
      console.log('   User ID:', existingAdmin.id);
      return;
    } else {
      console.error(`❌ User ${adminEmail} already exists with role ${existingAdmin.role}`);
      console.log('   Cannot convert existing user to super admin automatically.');
      console.log('   Please delete the user first or use a different email.');
      process.exit(1);
    }
  }

  // Create super admin user
  const superAdmin = await prisma.user.create({
    data: {
      email: adminEmail,
      supabaseUserId,
      role: UserRole.SUPER_ADMIN,
      businessId: null, // Super admin has no business
    },
  });

  console.log('✅ Super admin created successfully!');
  console.log('   Email:', superAdmin.email);
  console.log('   User ID:', superAdmin.id);
  console.log('   Role:', superAdmin.role);
  console.log('\n🔐 You can now log in with this email at /login');
  console.log('   Then access admin dashboard at /admin');
}

main()
  .catch((error) => {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

