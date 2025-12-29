# Migration Guide: Phase 2 Schema Updates

This guide explains how to migrate your database to support the new Phase 2 features (Super Admin, Integration model, etc.).

---

## ⚠️ IMPORTANT: Migration Steps

### Step 1: Backup Your Database

**Before making any changes, backup your database!**

```bash
# Using Supabase CLI (if installed)
supabase db dump > backup_$(date +%Y%m%d_%H%M%S).sql

# Or export from Supabase dashboard
# Go to Settings → Database → Backups
```

---

### Step 2: Migrate Existing User Roles

The `User.role` field has changed from `String` to `UserRole` enum. Existing users with `role='owner'` need to be converted to `BUSINESS_OWNER`.

**Option A: Using SQL (Recommended)**

Connect to your database and run:

```sql
-- Update existing users from 'owner' to 'BUSINESS_OWNER'
UPDATE "User" SET role = 'BUSINESS_OWNER' WHERE role = 'owner';
```

**Option B: Using Prisma Studio**

1. Run `npx prisma studio`
2. Navigate to User model
3. For each user with `role = "owner"`, change to `BUSINESS_OWNER`
4. Save

**Option C: Manual Migration Script**

If you have many users, you can create a migration script (see `migrate-user-roles.ts` below).

---

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

This will regenerate the Prisma client with the new schema types.

---

### Step 4: Push Schema Changes

```bash
npx prisma db push
```

This will:
- Add new enums (UserRole, IntegrationType)
- Update Channel enum (add INSTAGRAM, FACEBOOK)
- Add Integration model
- Add WebhookLog model
- Update User model (enum role, nullable businessId)
- Update Customer model (add instagramId, facebookId)
- Update Business model (add Integration relation, usage limits)

**Note:** If you see errors about existing data, you may need to handle them manually.

---

### Step 5: Verify Migration

```bash
# Open Prisma Studio to verify
npx prisma studio

# Check:
# - User roles are BUSINESS_OWNER (not "owner")
# - New models exist (Integration, WebhookLog)
# - User.businessId can be null
```

---

### Step 6: Set Environment Variables

Add to your `.env` file:

```bash
# Encryption key (generate: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-character-hex-string-here
```

Generate the key:
```bash
openssl rand -hex 32
```

---

## 🔧 Migration Script (Optional)

If you need to migrate many users programmatically, create `prisma/migrate-user-roles.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateUserRoles() {
  const users = await prisma.user.findMany({
    where: {
      role: 'owner' as any, // Type cast for old schema
    },
  });

  console.log(`Found ${users.length} users with role='owner'`);

  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'BUSINESS_OWNER' as any, // Will be enum after migration
      },
    });
    console.log(`Updated user ${user.email}`);
  }

  console.log('Migration complete!');
}

migrateUserRoles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with:
```bash
npx tsx prisma/migrate-user-roles.ts
```

---

## 🚨 Troubleshooting

### Error: "Invalid value for enum UserRole"

**Cause:** Existing users still have `role='owner'` (string) instead of enum.

**Solution:** Run Step 2 migration SQL query before pushing schema.

---

### Error: "Foreign key constraint violation"

**Cause:** Some users might have invalid businessId references.

**Solution:** 
```sql
-- Check for users with invalid businessId
SELECT u.id, u.email, u.businessId 
FROM "User" u 
LEFT JOIN "Business" b ON u.businessId = b.id 
WHERE u.businessId IS NOT NULL AND b.id IS NULL;

-- Fix or remove invalid references
```

---

### Error: "Column 'businessId' cannot be null"

**Cause:** Trying to make businessId nullable but existing users have NOT NULL constraint.

**Solution:** Prisma should handle this automatically, but if not:
1. Make businessId nullable first (if schema allows)
2. Then update enum

---

## ✅ Post-Migration Checklist

- [ ] All existing users have role = `BUSINESS_OWNER`
- [ ] New enums exist (UserRole, IntegrationType)
- [ ] Integration model exists
- [ ] WebhookLog model exists
- [ ] Customer model has instagramId and facebookId fields
- [ ] Business model has Integration relation
- [ ] Business model has messagesLimit and voiceMinutesLimit fields
- [ ] User.businessId is nullable
- [ ] ENCRYPTION_KEY is set in .env
- [ ] App runs without errors

---

## 📝 Next Steps After Migration

1. **Create first super admin** (see `prisma/seed.ts`)
2. **Test authentication** - Verify users can still log in
3. **Test super admin** - Verify admin routes work
4. **Continue with Phase 2 development** - Meta integration, etc.

---

**If you encounter any issues, check Prisma logs and database constraints.**


