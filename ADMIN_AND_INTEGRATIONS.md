# Admin System & Meta Integrations - Current Status & Design

This document explains the current state and design plans for admin roles and Meta/Facebook/WhatsApp integrations.

---

## 🔐 1. Superadmin / Admin System

### Current Status: **NOT IMPLEMENTED** ❌

**What exists:**
- `User` model has a `role` field (defaults to `"owner"`)
- Role is stored as a string in the database
- No role-based access control (RBAC) system
- No admin/superadmin concept

**What's missing:**
- No superadmin role definition
- No admin management UI
- No permission system
- No way to manage multiple businesses (if needed)
- No platform-level administration

### Recommended Design:

#### Option A: Simple Business-Level Admin (Current Scope)
```typescript
// User roles within a business
enum UserRole {
  OWNER = "owner",      // Business owner (full access)
  ADMIN = "admin",      // Admin user (manage team)
  MEMBER = "member",    // Team member (limited access)
}
```

#### Option B: Platform-Level Superadmin (Multi-Tenant)
If you need a platform admin to manage all businesses:

```typescript
// Add to User model
role          String    @default("owner")  // Business-level role
platformRole  String?   // Platform-level role: "superadmin" | null

// Superadmin can:
// - View all businesses
// - Manage system settings
// - View platform-wide analytics
// - Suspend/activate businesses
```

**Recommended:** Start with **Option A** (business-level roles). Add platform superadmin later if needed.

---

## 📱 2. Meta/Facebook/WhatsApp Integration

### Current Status: **NOT IMPLEMENTED** ❌ (Phase 2 Feature)

**What exists in schema:**
- `Business.whatsappPhoneId` field (line 104 in schema)
- `Customer.whatsappId` field (line 176 in schema)
- `Channel.WHATSAPP` enum value
- Fields are defined but not used

**What's missing:**
- Meta/Facebook OAuth integration
- WhatsApp Business API connection
- Webhook handlers for incoming messages
- Message sending functionality
- Connection UI/page
- API routes for managing connections

### How Meta Integration Should Work:

#### Step 1: Meta Developer Setup
1. Create Facebook App at https://developers.facebook.com
2. Add WhatsApp Business API product
3. Get App ID, App Secret
4. Configure webhook URL

#### Step 2: OAuth Flow (Connect Meta Account)
```
User clicks "Connect WhatsApp" in Settings
→ Redirect to Facebook OAuth
→ User authorizes app
→ Receive access token
→ Store tokens in Business model
→ Verify webhook connection
```

#### Step 3: Schema Changes Needed:
```prisma
model Business {
  // Existing
  whatsappPhoneId     String?
  
  // ADD THESE:
  metaAppId           String?      // Facebook App ID
  metaAccessToken     String?      // Long-lived access token
  metaRefreshToken    String?      // Token refresh
  metaPhoneNumberId   String?      // WhatsApp Business Phone Number ID
  metaBusinessAcctId  String?      // Meta Business Account ID
  whatsappConnectedAt DateTime?
  whatsappVerified    Boolean      @default(false)
}
```

#### Step 4: API Routes Needed:
```typescript
// GET /api/integrations/meta/auth-url
// → Returns OAuth URL to redirect user

// GET /api/integrations/meta/callback
// → Handles OAuth callback, saves tokens

// POST /api/integrations/meta/disconnect
// → Disconnects WhatsApp integration

// POST /api/webhooks/meta
// → Receives incoming WhatsApp messages

// POST /api/whatsapp/send
// → Sends message via WhatsApp API
```

#### Step 5: Webhook Handler
```typescript
// app/api/webhooks/meta/route.ts
// - Verify webhook signature
// - Process incoming messages
// - Create/update customers
// - Create conversations
// - Send to AI chat service
```

---

## 🔗 3. How Users Will Connect Their Pages

### User Flow:

1. **User goes to Settings → Integrations**
   ```
   /dashboard/settings/integrations
   ```

2. **Clicks "Connect WhatsApp"**
   - Button shows connection status
   - If not connected: "Connect WhatsApp Business"
   - If connected: "Disconnect" + phone number

3. **OAuth Flow:**
   ```
   → Click "Connect"
   → Redirect to: https://www.facebook.com/v18.0/dialog/oauth?
        client_id={APP_ID}&
        redirect_uri={CALLBACK_URL}&
        scope=whatsapp_business_management,whatsapp_business_messaging
   → User authorizes
   → Meta redirects back to: /api/integrations/meta/callback?code=...
   → Exchange code for access token
   → Get phone number ID
   → Save to database
   → Verify webhook
   → Show success message
   ```

4. **Webhook Setup:**
   - After connection, app needs to:
     - Register webhook URL with Meta
     - Verify webhook token
     - Subscribe to message events

### Implementation Steps:

#### Phase 1: Basic Connection
- [ ] Create `/dashboard/settings/integrations` page
- [ ] Add Meta OAuth button
- [ ] Create `/api/integrations/meta/auth-url` endpoint
- [ ] Create `/api/integrations/meta/callback` endpoint
- [ ] Store tokens in database
- [ ] Show connection status

#### Phase 2: Webhook & Messaging
- [ ] Create `/api/webhooks/meta` endpoint
- [ ] Register webhook with Meta API
- [ ] Handle incoming messages
- [ ] Create `/api/whatsapp/send` endpoint
- [ ] Integrate with existing chat service

#### Phase 3: Full Integration
- [ ] Template message support
- [ ] Media messages (images, documents)
- [ ] Read receipts
- [ ] Delivery status tracking
- [ ] Bulk messaging (if needed)

---

## 📋 Recommended Implementation Order

### Priority 1: Basic Admin Roles (Optional but Recommended)
1. Add role enum/validation
2. Update User model if needed
3. Add role checks to API routes
4. Update settings page for team management

### Priority 2: Meta Integration Setup (Phase 2)
1. Update schema with Meta fields
2. Create integrations settings page
3. Implement OAuth flow
4. Store tokens securely

### Priority 3: WhatsApp Messaging (Phase 2)
1. Webhook handler
2. Message processing
3. Send message API
4. Integration with chat service

---

## 🔑 Environment Variables Needed

```bash
# Meta/Facebook App
META_APP_ID=your_facebook_app_id
META_APP_SECRET=your_facebook_app_secret
META_VERIFY_TOKEN=your_webhook_verify_token  # Random string for webhook verification
NEXT_PUBLIC_META_APP_ID=your_facebook_app_id  # For OAuth redirect

# Webhook URL (set in Meta Dashboard)
WEBHOOK_URL=https://yourdomain.com/api/webhooks/meta
```

---

## 📚 Resources

- **Meta Developers:** https://developers.facebook.com/docs/whatsapp
- **WhatsApp Business API:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **OAuth Guide:** https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
- **Webhooks:** https://developers.facebook.com/docs/graph-api/webhooks

---

## ⚠️ Important Notes

1. **WhatsApp Business API is not free** - Requires Meta Business Account approval
2. **Webhook URL must be HTTPS** - Use ngrok for development
3. **Token storage** - Store tokens encrypted or use Supabase Vault
4. **Rate limits** - Meta has strict rate limits on messaging
5. **Phone number verification** - Required for production use

---

**Current Status Summary:**
- ✅ Schema has placeholder fields
- ❌ No implementation code
- ❌ No UI/UX for connections
- ❌ No webhook handlers
- 📅 Planned for Phase 2


