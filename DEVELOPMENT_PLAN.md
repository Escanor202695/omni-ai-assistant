# Phase 2 Development Plan: Meta Integration & Super Admin

Based on analysis of `complete-architecture.md` vs current codebase.

---

## 🎯 Division of Work

| Developer | Focus Area |
|-----------|------------|
| **You** | Meta Apps (WhatsApp, Instagram, Facebook) + Super Admin |
| **Friend** | Vapi Voice Integration |
| **Shared** | Schema updates, Core AI agent improvements |

---

## 📋 Your Tasks (Meta + Super Admin)

### Sprint 1: Schema & Infrastructure (Days 1-3)

#### Task 1.1: Update Database Schema

**Current gaps vs target architecture:**

```prisma
// ADD these new enums
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

// UPDATE Channel enum - add INSTAGRAM, FACEBOOK
enum Channel {
  WEBCHAT
  VOICE
  WHATSAPP
  INSTAGRAM   // NEW
  FACEBOOK    // NEW
  SMS
  EMAIL
}

// ADD Integration model (for OAuth tokens)
model Integration {
  id            String          @id @default(cuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  type          IntegrationType
  isActive      Boolean         @default(true)
  
  // Encrypted OAuth tokens
  accessToken   String          // Encrypted
  refreshToken  String?         // Encrypted
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

// ADD WebhookLog model (for debugging)
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

// UPDATE User model - change role to enum
model User {
  // ... existing fields ...
  role          UserRole  @default(BUSINESS_OWNER)  // Changed from String
  // Add nullable businessId for SUPER_ADMIN
  businessId    String?   // Nullable for SUPER_ADMIN
}

// UPDATE Customer model - add channel identifiers
model Customer {
  // ... existing fields ...
  instagramId   String?   // NEW
  facebookId    String?   // NEW
  
  @@unique([businessId, instagramId])  // NEW
  @@unique([businessId, facebookId])   // NEW
}

// UPDATE Business model - add integrations relation
model Business {
  // ... existing fields ...
  integrations    Integration[]  // NEW
  
  // Usage limits
  messagesLimit       Int       @default(1000)   // NEW
  voiceMinutesLimit   Float     @default(100)    // NEW
}
```

#### Task 1.2: Create Encryption Library

```
lib/encryption.ts
```
- AES-256-GCM encryption for OAuth tokens
- Environment variable: `ENCRYPTION_KEY` (32-byte hex)

#### Task 1.3: Update Middleware for Super Admin

```
middleware.ts
```
- Check for SUPER_ADMIN role
- Add `x-business-id` header for scoped routes
- Allow admin routes for SUPER_ADMIN only

---

### Sprint 2: Super Admin System (Days 4-6)

#### Task 2.1: Admin API Routes

```
app/api/admin/
├── businesses/
│   ├── route.ts              # GET (list all), POST (create)
│   └── [businessId]/
│       └── route.ts          # GET, PATCH, DELETE
├── stats/
│   └── route.ts              # GET system-wide stats
└── users/
    └── route.ts              # Manage super admins
```

**Endpoints:**
- `GET /api/admin/businesses` - List all businesses (paginated)
- `POST /api/admin/businesses` - Create new business
- `GET /api/admin/businesses/:id` - Get business details
- `PATCH /api/admin/businesses/:id` - Update business
- `DELETE /api/admin/businesses/:id` - Delete business
- `GET /api/admin/stats` - System-wide metrics

#### Task 2.2: Admin Dashboard Pages

```
app/(admin)/
├── layout.tsx                # Admin layout (different from business dashboard)
├── page.tsx                  # Admin home (redirect to /admin/dashboard)
├── admin/
│   ├── layout.tsx           # Nested layout with sidebar
│   ├── page.tsx             # Admin dashboard overview
│   ├── businesses/
│   │   ├── page.tsx         # List all businesses
│   │   └── [id]/
│   │       └── page.tsx     # Single business detail/edit
│   └── users/
│       └── page.tsx         # Manage admin users
```

#### Task 2.3: Create First Super Admin

- Seed script or manual DB insert
- Update registration to allow super admin creation (env flag)

---

### Sprint 3: Meta OAuth Integration (Days 7-10)

#### Task 3.1: Meta Developer App Setup (Prerequisites)

1. Create Meta Developer account
2. Create Meta App (Business type)
3. Add products: WhatsApp, Instagram Messaging, Messenger
4. Configure OAuth settings:
   - Redirect URI: `https://yourdomain.com/api/integrations/meta/callback`
5. Submit for app review (takes time)

#### Task 3.2: OAuth Connect Flow

```
app/api/integrations/meta/
├── connect/
│   └── route.ts              # GET - generates OAuth URL, redirects user
└── callback/
    └── route.ts              # GET - handles OAuth callback, saves tokens
```

**Flow:**
1. User clicks "Connect WhatsApp" → `/api/integrations/meta/connect?type=whatsapp`
2. Server generates OAuth URL with scopes
3. User authorizes on Facebook
4. Facebook redirects to `/api/integrations/meta/callback`
5. Exchange code for access token
6. Encrypt and save token to Integration model
7. Redirect to dashboard with success message

**Scopes needed:**
- WhatsApp: `whatsapp_business_management`, `whatsapp_business_messaging`
- Instagram: `instagram_basic`, `instagram_manage_messages`, `pages_messaging`
- Facebook: `pages_messaging`, `pages_manage_metadata`

#### Task 3.3: Integrations Dashboard Page

```
app/(dashboard)/integrations/page.tsx
```

Features:
- List connected integrations
- Connect/disconnect buttons
- Status indicators (active, expired, error)
- Phone number / page name display

---

### Sprint 4: Meta Webhook Handler (Days 11-14)

#### Task 4.1: Webhook Endpoint

```
app/api/webhooks/meta/route.ts
```

**Handles:**
- Webhook verification (GET with hub.verify_token)
- Incoming messages (POST)
- Message status updates
- Error logging

**Key logic:**
1. Verify webhook signature
2. Parse payload (different format for WhatsApp vs Instagram/Facebook)
3. Find business by platformId (phone_number_id or page_id)
4. Find/create customer
5. Find/create conversation
6. Save incoming message
7. Process with AI agent
8. Send response back via Meta API
9. Save AI response

#### Task 4.2: Meta API Helpers

```
lib/integrations/meta.ts
```

Functions:
- `sendWhatsAppMessage(params)` - Send text/media via WhatsApp
- `sendInstagramMessage(params)` - Send via Instagram DM
- `sendFacebookMessage(params)` - Send via Messenger
- `verifyWebhookSignature(body, signature)` - Verify Meta signature

#### Task 4.3: Update AI Agent for Multi-Channel

Update `services/ai.service.ts`:
- Channel-aware response formatting
- Shorter responses for WhatsApp/Instagram
- Handle media messages (future)

---

### Sprint 5: Testing & Polish (Days 15-17)

#### Task 5.1: Testing Infrastructure

- Test webhook with Meta's test tools
- Use ngrok for local webhook testing
- Test OAuth flow end-to-end
- Test message sending/receiving

#### Task 5.2: Error Handling

- Retry logic for failed messages
- Token refresh when expired
- Graceful degradation
- User-friendly error messages

#### Task 5.3: Monitoring

- WebhookLog review page in admin
- Integration health checks
- Usage tracking per business

---

## 📁 New Files to Create

### Core Infrastructure

```
lib/
├── encryption.ts                      # Token encryption/decryption
├── integrations/
│   ├── meta.ts                        # Meta API helpers
│   └── index.ts                       # Export all integrations
├── utils/
│   └── webhook-verify.ts              # Webhook signature verification
```

### API Routes

```
app/api/
├── admin/
│   ├── businesses/
│   │   ├── route.ts
│   │   └── [businessId]/route.ts
│   └── stats/route.ts
├── integrations/
│   └── meta/
│       ├── connect/route.ts
│       └── callback/route.ts
└── webhooks/
    └── meta/route.ts
```

### Dashboard Pages

```
app/(admin)/
├── layout.tsx
├── page.tsx
└── admin/
    ├── layout.tsx
    ├── page.tsx
    └── businesses/
        ├── page.tsx
        └── [id]/page.tsx

app/(dashboard)/
└── integrations/page.tsx
```

### Services

```
services/
└── integration.service.ts             # Integration CRUD
```

---

## 🔐 Environment Variables Needed

```bash
# Add to .env

# Encryption (generate: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-character-hex-string

# Meta/Facebook App
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-random-verify-token

# Super Admin
SUPER_ADMIN_EMAIL=admin@yourcompany.com  # First super admin email
```

---

## 🗓️ Timeline Summary

| Sprint | Duration | Focus |
|--------|----------|-------|
| **Sprint 1** | Days 1-3 | Schema updates, encryption, middleware |
| **Sprint 2** | Days 4-6 | Super Admin API & Dashboard |
| **Sprint 3** | Days 7-10 | Meta OAuth (connect/callback) |
| **Sprint 4** | Days 11-14 | Meta Webhook handler |
| **Sprint 5** | Days 15-17 | Testing, error handling, polish |

**Total: ~17 days** (adjust based on pace)

---

## 🚀 Getting Started

### Step 1: Update Schema (Do First!)

```bash
# Edit prisma/schema.prisma with new models
# Then run:
npx prisma db push
npx prisma generate
```

### Step 2: Create Encryption Library

```bash
# Generate encryption key
openssl rand -hex 32
# Add to .env as ENCRYPTION_KEY
```

### Step 3: Set Up Meta Developer App

1. Go to https://developers.facebook.com
2. Create new app → Business type
3. Add WhatsApp, Instagram Messaging products
4. Configure webhook URL
5. Submit for review

### Step 4: Start Coding!

Begin with Sprint 1, Task 1.1 (schema updates).

---

## 📝 Notes

### Coordination with Friend (Vapi)

- Share updated schema before they start
- They'll need the `Integration` model too
- Vapi webhooks go to `/api/webhooks/vapi`
- Share the encryption library

### Meta App Review

- Takes 1-5 business days
- Start early!
- Need privacy policy URL
- Need business verification for production

### Testing Without Production Access

- Use Meta's test phone numbers
- Use ngrok for local webhook testing
- Can test OAuth flow in development mode

---

## 🔄 Dependencies

**Must complete before others can start:**
1. Schema updates (Sprint 1.1)
2. Encryption library (Sprint 1.2)

**Can work in parallel:**
- Super Admin (Sprint 2) - doesn't depend on Meta
- Meta OAuth (Sprint 3) - doesn't depend on Super Admin

---

## 📊 Success Criteria

✅ Super admin can log in and see all businesses
✅ Super admin can create/edit/delete businesses
✅ Business owner can connect WhatsApp via OAuth
✅ Business owner can connect Instagram via OAuth
✅ Incoming WhatsApp messages are received and processed
✅ AI responses are sent back to WhatsApp
✅ Same for Instagram DMs
✅ Tokens are encrypted in database
✅ Token refresh works when expired
✅ Webhook errors are logged and debuggable

---

**Next Step:** Start with Task 1.1 - Update the database schema. Want me to implement it?


