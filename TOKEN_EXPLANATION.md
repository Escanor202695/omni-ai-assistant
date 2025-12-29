# Understanding Meta Tokens - Quick Guide

## Two Different Types of Tokens

### 1. Webhook Verify Token (You Create This)

**What it is:**
- A random secret string YOU generate yourself
- NOT from Meta
- Used to verify webhook requests are actually from Meta

**How to generate:**
```bash
openssl rand -hex 32
```

**Where it goes:**
- In your `.env` file: `META_WEBHOOK_VERIFY_TOKEN=your-generated-string`
- In Meta App webhook settings (same value)

**Example:**
```bash
META_WEBHOOK_VERIFY_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**Purpose:**
When Meta sends webhook requests, they include this token. Your server checks it matches to ensure the request is legitimate.

---

### 2. Access Token (From Meta OAuth)

**What it is:**
- Token you get from Meta after OAuth authorization
- Used to make API calls (send messages, etc.)
- Can be temporary or long-lived

**Types:**

**Short-lived (Temporary):**
- Expires in 1-2 hours
- What you get immediately after OAuth

**Long-lived (Permanent-ish):**
- Lasts ~60 days
- Can be extended with refresh token
- Better for production

**Where it's stored:**
- Encrypted in your database (`Integration.accessToken`)
- Retrieved when needed for API calls

**How to get it:**
1. Connect platform through `/dashboard/integrations`
2. OAuth flow exchanges code for access token
3. Token is saved automatically
4. Use `scripts/get-integration-token.ts` to view it

---

## Summary

| Token Type | Who Creates It | Where It Goes | Purpose |
|------------|----------------|---------------|---------|
| **Webhook Verify Token** | You (generate random string) | `.env` file + Meta webhook settings | Verify webhook requests |
| **Access Token** | Meta (from OAuth) | Database (encrypted) | Make API calls |

---

## Common Confusion

❌ **Wrong:** "The access token is the webhook verify token"  
✅ **Correct:** They are completely separate:
- Webhook verify token = password you create
- Access token = API key from Meta

---

## Setup Checklist

- [ ] Generate webhook verify token: `openssl rand -hex 32`
- [ ] Add to `.env`: `META_WEBHOOK_VERIFY_TOKEN=...`
- [ ] Set same value in Meta App webhook settings
- [ ] Connect platform through UI (gets access token automatically)
- [ ] Access token is saved encrypted in database

---

**Need to view your access token?**
```bash
npx tsx scripts/get-integration-token.ts
```

This shows your decrypted access token (from OAuth, not the webhook verify token).

