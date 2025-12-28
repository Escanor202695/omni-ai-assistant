# Phase 2 Implementation Plan: Meta Integration + Super Admin

**Status:** 🟡 Planning Phase - Need Clarifications

---

## 🔍 Current State Analysis

### ✅ What We Have:
- Supabase Auth (not NextAuth as in architecture doc)
- User model with `role: String` (defaults to "owner")
- Business model exists
- Customer model with `whatsappId` field
- Channel enum with WHATSAPP
- Basic auth flow working
- Dashboard structure exists

### ❌ What's Missing:
- UserRole enum (SUPER_ADMIN, BUSINESS_OWNER, TEAM_MEMBER)
- Integration model (for OAuth tokens)
- WebhookLog model (for debugging)
- Encryption library (for token storage)
- Super Admin routes & pages
- Meta OAuth flow
- Meta webhook handler
- Customer.instagramId, Customer.facebookId fields
- INSTAGRAM, FACEBOOK in Channel enum
- Message.channel field (currently missing)

---

## ❓ DECISIONS NEEDED (Please Answer)

### Question 1: Authentication System
**Current:** Using Supabase Auth  
**Architecture Doc:** Mentions NextAuth.js

**Decision needed:** ✅ **KEEP Supabase Auth** (already working, no need to change)

**Impact:** 
- Super admin will still use Supabase Auth
- No changes needed to auth flow
- Just need to handle `businessId: null` for super admin

---

### Question 2: Super Admin businessId
**Architecture:** `businessId: String?` (nullable for SUPER_ADMIN)

**Decision needed:** ✅ **Make nullable** - Super admins don't belong to a business

**Impact:**
- Update User model: `businessId String?` (nullable)
- Update getServerSession() to handle null businessId
- Update middleware to allow admin routes for super admin
- Update all service methods that assume businessId exists

---

### Question 3: Message Channel Field
**Current:** Message model doesn't have `channel` field, but Conversation has it  
**Architecture:** Message has `channel: Channel`

**Decision needed:** ❓ **Optional** - Can infer from Conversation, but useful for analytics

**Impact:**
- Option A: Don't add (simpler, infer from conversation.channel)
- Option B: Add channel field to Message (more explicit, better for analytics)

**Recommendation:** Option A for MVP (don't add). Can add later if needed for analytics.

---

### Question 4: AI Settings Storage
**Current:** Business has `aiPersonality`, `aiGreeting`, `aiInstructions` (separate fields)  
**Architecture:** Business has `aiSettings Json` (single JSON field)

**Decision needed:** ❓ **Keep separate fields OR migrate to JSON?**

**Recommendation:** Keep separate fields for now (easier to query, type-safe). Can migrate later if needed.

---

### Question 5: Business Usage Limits
**Architecture:** `messagesLimit Int`, `voiceMinutesLimit Float`  
**Current:** Only has counters, no limits

**Decision needed:** ✅ **ADD limit fields** - Needed for rate limiting

---

### Question 6: Business.aiSettings Format
**Architecture:** JSON with structure:
```json
{
  "personality": "...",
  "businessType": "...",
  "greeting": "...",
  "services": [...]
}
```

**Decision needed:** ❓ **Keep current separate fields OR add aiSettings JSON?**

**Recommendation:** Keep current structure for MVP. Add aiSettings JSON as optional field for future flexibility.

---

## 📋 STEP-BY-STEP IMPLEMENTATION PLAN

### Phase 1: Schema Updates (CRITICAL - Do First!) ⚡

#### Step 1.1: Create New Enums
```prisma
enum UserRole {
  SUPER_ADMIN
  BUSINESS_OWNER
  TEAM_MEMBER
}

enum IntegrationType {
  WHATSAPP
  INSTAGRAM
  FACEBOOK
  VAPI
  GOOGLE_CALENDAR
  EMAIL
}
```

**Action:** Add to schema.prisma

---

#### Step 1.2: Update Existing Enums
```prisma
enum Channel {
  WEBCHAT
  VOICE
  WHATSAPP
  INSTAGRAM      // NEW
  FACEBOOK       // NEW
  SMS
  EMAIL
}
```

**Action:** Add INSTAGRAM, FACEBOOK to Channel enum

---

#### Step 1.3: Update User Model
```prisma
model User {
  // ... existing fields ...
  role          UserRole  @default(BUSINESS_OWNER)  // Changed from String
  businessId    String?   // Changed to nullable for SUPER_ADMIN
  business      Business? @relation(fields: [businessId], references: [id])  // Nullable relation
  // ... rest
}
```

**Migration Impact:** ⚠️ **Breaking Change**
- Existing users with role="owner" need migration: convert to BUSINESS_OWNER
- All existing users have businessId, so safe to make nullable
- Need migration script to convert string roles to enum

---

#### Step 1.4: Add Integration Model
```prisma
model Integration {
  id            String          @id @default(cuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  type          IntegrationType
  isActive      Boolean         @default(true)
  
  // Encrypted OAuth tokens
  accessToken   String          // Will be encrypted
  refreshToken  String?         // Will be encrypted
  tokenExpiry   DateTime?
  
  // Platform identifiers
  platformId    String          // WhatsApp phone_number_id, Instagram page_id, etc.
  platformName  String?         // Display name
  
  // Platform-specific metadata
  metadata      Json            @default("{}")
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([businessId, type, platformId])
  @@index([businessId])
  @@index([platformId])
  @@index([type, platformId])
}
```

**Action:** Add new model to schema

---

#### Step 1.5: Add WebhookLog Model
```prisma
model WebhookLog {
  id            String    @id @default(cuid())
  source        String    // "meta", "vapi", "stripe"
  event         String    // "message", "call_ended", etc.
  payload       Json
  processed     Boolean   @default(false)
  error         String?
  
  createdAt     DateTime  @default(now())

  @@index([source, createdAt])
  @@index([processed])
}
```

**Action:** Add new model to schema

---

#### Step 1.6: Update Customer Model
```prisma
model Customer {
  // ... existing fields ...
  instagramId   String?   // NEW
  facebookId    String?   // NEW
  
  @@unique([businessId, instagramId])  // NEW
  @@unique([businessId, facebookId])   // NEW
  // ... rest
}
```

**Action:** Add new fields

---

#### Step 1.7: Update Message Model (OPTIONAL)
**Decision:** Skip for MVP - channel can be inferred from Conversation

If needed later, add:
```prisma
model Message {
  // ... existing fields ...
  channel       Channel   // Optional - can infer from conversation
  // ... rest
}
```

---

#### Step 1.8: Update Business Model
```prisma
model Business {
  // ... existing fields ...
  integrations    Integration[]  // NEW relation
  
  // Usage limits (NEW)
  messagesLimit       Int       @default(1000)
  voiceMinutesLimit   Float     @default(100)
  
  // Remove old channel-specific fields (optional cleanup)
  // whatsappPhoneId  String?  // Remove - now in Integration
  // vapiAssistantId  String?  // Remove - now in Integration
  // vapiPhoneNumber  String?  // Remove - now in Integration
}
```

**Migration Decision:** ❓ Keep old fields for backward compatibility or remove?
**Recommendation:** Keep them for now, deprecate later. Your friend might need them.

---

### Phase 2: Infrastructure Setup

#### Step 2.1: Create Encryption Library
**File:** `lib/encryption.ts`

**Requirements:**
- AES-256-GCM encryption
- Environment variable: `ENCRYPTION_KEY` (32-byte hex, generate with `openssl rand -hex 32`)
- Functions: `encrypt(text: string): string`, `decrypt(encrypted: string): string`

**Help Needed:** None - can implement directly

---

#### Step 2.2: Update Auth Helpers
**File:** `lib/supabase/server.ts`

**Changes Needed:**
- Update `getServerSession()` to handle `businessId: null` for super admin
- Return type should include `businessId: string | null`

**Code Change:**
```typescript
export interface ServerSession {
  userId: string;
  businessId: string | null;  // Changed: nullable
  email: string;
  role: UserRole;  // Changed: enum instead of string
}

export async function getServerSession(): Promise<ServerSession | null> {
  // ... existing code ...
  
  // Handle super admin (no business)
  if (dbUser.role === 'SUPER_ADMIN') {
    return {
      userId: dbUser.id,
      businessId: null,  // Super admin has no business
      email: dbUser.email,
      role: dbUser.role as UserRole,
    };
  }
  
  // Regular users must have businessId
  if (!dbUser.businessId) {
    return null; // Invalid state
  }
  
  return {
    userId: dbUser.id,
    businessId: dbUser.businessId,
    email: dbUser.email,
    role: dbUser.role as UserRole,
  };
}
```

**Help Needed:** None - can implement directly

---

#### Step 2.3: Update Middleware
**File:** `middleware.ts`

**Changes Needed:**
- Allow `/admin/*` routes for SUPER_ADMIN
- Redirect super admin to `/admin` instead of `/dashboard`
- Add business scoping headers

**Help Needed:** None - can implement directly

---

### Phase 3: Super Admin System

#### Step 3.1: Create First Super Admin
**Options:**
1. Seed script (recommended)
2. Manual DB insert
3. Environment variable + migration

**Decision Needed:** ❓ Which method do you prefer?

**Recommendation:** Seed script - `prisma/seed.ts` with environment check:
```typescript
// Only runs if SUPER_ADMIN_EMAIL env var is set
// Creates user if doesn't exist
```

---

#### Step 3.2: Admin API Routes
**Files to Create:**
- `app/api/admin/businesses/route.ts` - GET (list), POST (create)
- `app/api/admin/businesses/[businessId]/route.ts` - GET, PATCH, DELETE
- `app/api/admin/stats/route.ts` - System-wide stats

**Help Needed:** 
- What stats do you want? (total businesses, total messages, active users, etc.)
- What fields are editable by super admin?
- Should super admin be able to delete businesses? (cascade delete?)

---

#### Step 3.3: Admin Dashboard Pages
**Files to Create:**
- `app/(admin)/layout.tsx` - Admin layout (separate from business dashboard)
- `app/(admin)/admin/layout.tsx` - Nested layout with sidebar
- `app/(admin)/admin/page.tsx` - Admin dashboard home
- `app/(admin)/admin/businesses/page.tsx` - List all businesses
- `app/(admin)/admin/businesses/[id]/page.tsx` - Business detail/edit

**Help Needed:**
- What should admin dashboard home show? (overview stats?)
- What fields should be editable? (all? or specific ones?)

---

### Phase 4: Meta OAuth Integration

#### Step 4.1: Meta Developer App Setup
**Prerequisites (Do THIS FIRST - takes 1-5 days for review):**
1. Create Meta Developer account
2. Create Meta App (Business type)
3. Add products: WhatsApp Business API, Instagram Messaging, Messenger
4. Configure OAuth redirect URI: `https://yourdomain.com/api/integrations/meta/callback`
5. Submit for app review

**Help Needed:** 
- ❓ Do you have Meta Developer account?
- ❓ Do you want to set this up now or can I provide instructions?
- ❓ What's your production domain? (for redirect URI)

**Required Info:**
- Privacy Policy URL (required for review)
- App icon and description
- Business verification (for production)

---

#### Step 4.2: Integration Service
**File:** `services/integration.service.ts`

**Functions Needed:**
- `create(businessId, type, tokenData)` - Create integration, encrypt tokens
- `getByBusiness(businessId)` - Get all integrations for business
- `getByPlatformId(type, platformId)` - For webhook routing
- `updateToken(id, tokenData)` - Refresh tokens
- `delete(id)` - Disconnect integration

**Help Needed:** None - can implement directly

---

#### Step 4.3: OAuth Connect Route
**File:** `app/api/integrations/meta/connect/route.ts`

**Flow:**
1. GET with query param: `?type=whatsapp` or `?type=instagram`
2. Generate OAuth URL with correct scopes
3. Redirect user to Meta OAuth page

**Scopes Needed:**
- WhatsApp: `whatsapp_business_management`, `whatsapp_business_messaging`
- Instagram: `instagram_basic`, `instagram_manage_messages`, `pages_messaging`
- Facebook: `pages_messaging`, `pages_manage_metadata`

**Help Needed:**
- ❓ Should we support connecting multiple WhatsApp numbers per business?
- ❓ Or just one WhatsApp number per business?

**Recommendation:** One per business for MVP (can add multiple later)

---

#### Step 4.4: OAuth Callback Route
**File:** `app/api/integrations/meta/callback/route.ts`

**Flow:**
1. GET with `code` query param
2. Exchange code for access token
3. Get long-lived token (if needed)
4. Get phone number ID or page ID
5. Encrypt and save to Integration model
6. Redirect to dashboard with success

**Help Needed:** None - can implement directly

---

#### Step 4.5: Integrations Dashboard Page
**File:** `app/(dashboard)/integrations/page.tsx`

**Features:**
- List connected integrations
- Connect button for each type (WhatsApp, Instagram, Facebook)
- Disconnect button
- Status indicators (connected, expired, error)
- Display phone number / page name

**Help Needed:**
- ❓ Should disconnecting delete the Integration record or just mark inactive?
**Recommendation:** Mark inactive (preserves history), add delete option later

---

### Phase 5: Meta Webhook Handler

#### Step 5.1: Meta API Helpers
**File:** `lib/integrations/meta.ts`

**Functions:**
- `sendWhatsAppMessage(params)` - Send via WhatsApp
- `sendInstagramMessage(params)` - Send via Instagram DM
- `sendFacebookMessage(params)` - Send via Messenger
- `verifyWebhookSignature(body, signature)` - Verify Meta signature

**Help Needed:** None - can implement directly

---

#### Step 5.2: Webhook Route
**File:** `app/api/webhooks/meta/route.ts`

**Handles:**
- GET: Webhook verification (hub.verify_token)
- POST: Incoming messages

**Flow:**
1. Verify signature
2. Parse payload (different for WhatsApp vs Instagram/Facebook)
3. Find business by platformId
4. Find/create customer
5. Find/create conversation
6. Save incoming message
7. Process with AI (reuse existing AIService)
8. Send response via Meta API
9. Save AI response

**Help Needed:**
- ❓ Should we use existing `/api/chat` endpoint or create separate logic?
**Recommendation:** Create separate webhook handler, reuse AIService logic (don't call HTTP endpoint internally)

---

#### Step 5.3: Update AI Service
**Files:** `services/ai.service.ts`

**Changes:**
- Channel-aware response formatting
- Handle shorter responses for WhatsApp/Instagram
- Support for media messages (future - can skip for MVP)

**Help Needed:** None - can implement directly

---

## 🔄 Migration Strategy

### Critical: User Role Migration

**Problem:** Existing users have `role: String = "owner"`, need to convert to `UserRole` enum

**Solution:**
```sql
-- Migration script (run before schema push)
UPDATE "User" SET role = 'BUSINESS_OWNER' WHERE role = 'owner';
-- Or handle in Prisma migration
```

**Decision Needed:** ❓ Run migration before or after schema change?
**Recommendation:** Create Prisma migration that handles both enum creation and data migration

---

### Critical: Message Channel Migration

**Problem:** Existing messages have no `channel` field, new schema requires it

**Solution:**
```prisma
channel Channel @default(WEBCHAT)  // Set default in schema
```

**Then run:**
```sql
UPDATE "Message" SET channel = 'WEBCHAT' WHERE channel IS NULL;
```

---

## 📝 Environment Variables Needed

Add to `.env`:
```bash
# Encryption (generate: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-character-hex-string

# Meta/Facebook App
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-random-verify-token

# Super Admin (optional - for seed script)
SUPER_ADMIN_EMAIL=admin@yourcompany.com
```

---

## 🚨 BLOCKERS & DEPENDENCIES

### Must Do Before Starting:
1. ✅ **Create Meta Developer App** - Takes 1-5 days for approval
2. ✅ **Generate ENCRYPTION_KEY** - `openssl rand -hex 32`
3. ❓ **Decide on migration strategy** - When to run migrations?

### Can Start Immediately:
- Schema updates (Phase 1)
- Encryption library (Phase 2.1)
- Super Admin system (Phase 3) - doesn't depend on Meta
- Integration service (Phase 4.2) - can write without Meta setup

### Need Your Input:
1. ❓ Super admin creation method? (seed script vs manual)
2. ❓ Admin dashboard features? (what stats, what's editable?)
3. ❓ Multiple WhatsApp numbers per business? (yes/no)
4. ❓ Disconnect behavior? (delete vs mark inactive)
5. ❓ Production domain? (for OAuth redirect URI)
6. ❓ Meta Developer account status? (have it? need setup?)
7. ❓ Migration timing? (before/after schema change)

---

## ✅ RECOMMENDED STARTING ORDER

### Week 1: Foundation (Can Start NOW)

**Day 1-2: Schema Updates**
1. Add enums (UserRole, IntegrationType)
2. Update Channel enum
3. Add Integration model
4. Add WebhookLog model
5. Update User model (nullable businessId, enum role)
6. Update Customer model (instagramId, facebookId)
7. Update Message model (add channel)
8. Update Business model (integration relation, limits)
9. Create Prisma migration
10. Test migration

**Day 3: Encryption & Auth**
1. Create encryption library
2. Update getServerSession() for super admin
3. Update middleware for admin routes
4. Test auth flow

**Day 4-5: Super Admin Core**
1. Create seed script for first super admin
2. Create admin API routes (businesses, stats)
3. Create admin dashboard pages
4. Test super admin flow

### Week 2: Meta Integration (Need Meta App First)

**Day 6-7: OAuth Flow**
1. Set up Meta Developer App (YOU do this)
2. Create integration service
3. Create OAuth connect route
4. Create OAuth callback route
5. Test OAuth flow

**Day 8-9: Integrations UI**
1. Create integrations dashboard page
2. Test connect/disconnect flow

**Day 10-12: Webhook Handler**
1. Create Meta API helpers
2. Create webhook route (GET + POST)
3. Test webhook with ngrok
4. Integrate with AI service
5. Test end-to-end message flow

**Day 13-14: Testing & Polish**
1. Error handling
2. Token refresh logic
3. Webhook error logging
4. UI improvements

---

## 🎯 NEXT IMMEDIATE STEPS

### 1. Answer Questions Above
Please answer the ❓ questions marked in this doc.

### 2. Set Up Meta Developer App (Do NOW)
This takes time - start immediately:
- Go to https://developers.facebook.com
- Create account if needed
- Create new app → Business type
- Add WhatsApp, Instagram Messaging products
- Note the App ID and App Secret (save them!)

### 3. Generate Encryption Key
```bash
openssl rand -hex 32
# Save the output as ENCRYPTION_KEY in .env
```

### 4. Once Questions Answered
I'll start implementing Phase 1 (Schema Updates) immediately.

---

## 📊 Progress Tracking

- [ ] Phase 1: Schema Updates
  - [ ] New enums created
  - [ ] Integration model added
  - [ ] User model updated
  - [ ] Migration tested
- [ ] Phase 2: Infrastructure
  - [ ] Encryption library
  - [ ] Auth helpers updated
  - [ ] Middleware updated
- [ ] Phase 3: Super Admin
  - [ ] First super admin created
  - [ ] Admin API routes
  - [ ] Admin dashboard pages
- [ ] Phase 4: Meta OAuth
  - [ ] Meta Developer App set up
  - [ ] OAuth connect flow
  - [ ] OAuth callback
  - [ ] Integrations page
- [ ] Phase 5: Webhook Handler
  - [ ] Meta API helpers
  - [ ] Webhook route
  - [ ] End-to-end testing

---

**Ready to start when you answer the questions!** 🚀

