# Meta Integration Setup Guide

## Step-by-Step Guide to Connect WhatsApp, Instagram, and Facebook

### Prerequisites

Before you can connect platforms, you need to:

1. Create a Meta Developer App
2. Configure environment variables
3. Set up webhooks

---

## Step 1: Create Meta Developer App

### 1.1 Create Developer Account

1. Go to https://developers.facebook.com
2. Sign in with your Facebook account
3. Click "My Apps" → "Create App"

### 1.2 Create App

1. Select **"Business"** as app type
2. Fill in:
   - **App Name:** Your app name (e.g., "Omni AI Assistant")
   - **App Contact Email:** Your email
3. Click "Create App"

### 1.3 Add Products

Add these products to your app:

**For WhatsApp:**

1. Go to "Add Products" → Find "WhatsApp"
2. Click "Set Up"
3. Follow the setup wizard

**For Instagram:**

1. Go to "Add Products" → Find "Instagram"
2. Click "Set Up"
3. Select "Instagram Messaging API"

**For Facebook Messenger:**

1. Go to "Add Products" → Find "Messenger"
2. Click "Set Up"

---

## Step 2: Get App Credentials

### 2.1 Get App ID and Secret

1. Go to **Settings** → **Basic** in your Meta App dashboard
2. Copy:
   - **App ID** → This is your `META_APP_ID`
   - **App Secret** → Click "Show" and copy → This is your `META_APP_SECRET`

### 2.2 Generate Webhook Verify Token

**Important:** The webhook verify token is NOT an OAuth token. It's a secret string YOU create yourself.

1. Generate a random string:
   ```bash
   openssl rand -hex 32
   ```
2. Save this as your `META_WEBHOOK_VERIFY_TOKEN`
3. **This is different from access tokens** - it's just a password to verify webhook requests are from Meta

---

## Step 3: Configure OAuth Redirect URI

### 3.1 Add Redirect URI

1. Go to **Settings** → **Basic** in your Meta App
2. Scroll to **"Add Platform"** → Click **"Website"**
3. Add **Site URL:**
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### 3.2 Configure OAuth Settings

1. Go to **Products** → **Facebook Login** → **Settings**
2. Add **Valid OAuth Redirect URIs:**
   ```
   http://localhost:3000/api/integrations/meta/callback
   https://yourdomain.com/api/integrations/meta/callback
   ```
3. Click "Save Changes"

---

## Step 4: Set Up WhatsApp Business Account (For WhatsApp)

### 4.1 Create WhatsApp Business Account

1. Go to **WhatsApp** product in your Meta App
2. Click **"Get Started"**
3. Follow the setup wizard to create a WhatsApp Business Account (WABA)
4. Add a phone number (you can use Meta's test number for testing)

### 4.2 Get Phone Number ID

1. Go to **WhatsApp** → **API Setup**
2. Copy the **Phone Number ID** (you'll need this later)

---

## Step 5: Set Up Instagram (For Instagram Messaging)

### 5.1 Connect Instagram Account

1. Go to **Instagram** product in your Meta App
2. Click **"Set Up"** → **"Create App"**
3. Connect your Instagram Business Account
4. Go to **Instagram** → **Basic Display** → **User Token Generator**
5. Generate a token

### 5.2 Get Page ID

1. Go to **Instagram** → **Basic Display**
2. Your Page ID will be shown (you'll need this for webhooks)

---

## Step 6: Configure Environment Variables

Add these to your `.env` file:

```bash
# Meta App Configuration
META_APP_ID=your-app-id-here
META_APP_SECRET=your-app-secret-here
META_WEBHOOK_VERIFY_TOKEN=your-random-token-here

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption (should already be set)
ENCRYPTION_KEY=your-64-character-hex-key
```

**Example:**

```bash
META_APP_ID=1234567890123456
META_APP_SECRET=abcdef1234567890abcdef1234567890
META_WEBHOOK_VERIFY_TOKEN=my-secure-random-token-12345
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 7: Configure Webhooks (For Receiving Messages)

### 7.1 Set Up Webhook URL

**For Local Development (using ngrok):**

1. Install ngrok: `brew install ngrok` (Mac) or download from ngrok.com
2. Start your Next.js app: `npm run dev`
3. In another terminal, run: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**For Production:**

- Use your production URL: `https://yourdomain.com`

### 7.2 Configure Webhook in Meta

**For WhatsApp:**

1. Go to **WhatsApp** → **Configuration** → **Webhook**
2. Click **"Edit"**
3. Enter:
   - **Callback URL:** `https://yourdomain.com/api/webhooks/meta` (or ngrok URL)
   - **Verify Token:** (same as `META_WEBHOOK_VERIFY_TOKEN`)
4. Click **"Verify and Save"**
5. Subscribe to **"messages"** field

**For Instagram:**

1. Go to **Instagram** → **Webhooks**
2. Click **"Add Callback"**
3. Enter:
   - **Callback URL:** `https://yourdomain.com/api/webhooks/meta`
   - **Verify Token:** (same as `META_WEBHOOK_VERIFY_TOKEN`)
4. Click **"Verify"**
5. Subscribe to **"messages"** field

**For Facebook Messenger:**

1. Go to **Messenger** → **Webhooks**
2. Click **"Add Callback URL"**
3. Enter:
   - **Callback URL:** `https://yourdomain.com/api/webhooks/meta`
   - **Verify Token:** (same as `META_WEBHOOK_VERIFY_TOKEN`)
4. Click **"Verify"**
5. Subscribe to **"messages"** field

---

## Step 8: Connect Platforms from Your App

### 8.1 Start Your App

```bash
npm run dev
```

### 8.2 Navigate to Integrations Page

1. Go to `http://localhost:3000/dashboard/integrations`
2. You should see cards for WhatsApp, Instagram, and Facebook

### 8.3 Connect a Platform

1. Click **"Connect WhatsApp"** (or Instagram/Facebook)
2. You'll be redirected to Meta login page
3. Log in with your Facebook account
4. Authorize the app (grant permissions)
5. You'll be redirected back to your app
6. The platform should now show as **"Connected"**

---

## Step 9: Test the Integration

### 9.1 Test WhatsApp

1. Use Meta's test phone number (found in WhatsApp → API Setup)
2. Send a test message to your WhatsApp Business number
3. Check your app's `/dashboard/conversations` page
4. You should see the message and AI response

### 9.2 Test Instagram

1. Send a DM to your Instagram Business account
2. Check conversations in your app
3. AI should respond automatically

---

## Troubleshooting

### Issue: "OAuth authentication failed"

**Solution:**

- Check that `META_APP_ID` and `META_APP_SECRET` are correct
- Verify OAuth redirect URI is configured in Meta App settings
- Make sure `NEXT_PUBLIC_APP_URL` matches your actual URL

### Issue: "No access token received"

**Solution:**

- Check Meta App is in "Development" mode (or approved for production)
- Verify all required permissions are requested
- Check Meta App logs for errors

### Issue: "Could not retrieve platform information"

**Solution:**

- Make sure you've set up WhatsApp Business Account (for WhatsApp)
- Make sure Instagram account is connected (for Instagram)
- Check that you have the right permissions/scopes

### Issue: Webhook verification fails

**Solution:**

- Verify `META_WEBHOOK_VERIFY_TOKEN` matches in both:
  - Your `.env` file
  - Meta App webhook settings
- Make sure webhook URL is accessible (use ngrok for local testing)

### Issue: Messages not being received

**Solution:**

- Check webhook is subscribed to "messages" field
- Verify webhook URL is correct and accessible
- Check `WebhookLog` table in database for incoming webhooks
- Check server logs for errors

---

## Quick Checklist

- [ ] Meta Developer App created
- [ ] App ID and Secret copied
- [ ] Webhook verify token generated
- [ ] OAuth redirect URI configured
- [ ] Environment variables set in `.env`
- [ ] Webhook URL configured in Meta App
- [ ] Webhook subscribed to "messages" field
- [ ] WhatsApp Business Account created (for WhatsApp)
- [ ] Instagram account connected (for Instagram)
- [ ] Tested connection from `/dashboard/integrations`
- [ ] Tested sending/receiving messages

---

## Next Steps After Connection

Once connected:

1. ✅ Messages will automatically flow through webhook
2. ✅ AI will respond to messages automatically
3. ✅ Conversations will appear in `/dashboard/conversations`
4. ✅ Customers will be created automatically
5. ✅ You can view analytics in `/dashboard/analytics`

---

## Important Notes

- **Development Mode:** Meta apps start in Development mode. You can only test with:
  - Test phone numbers (WhatsApp)
  - Your own accounts (Instagram/Facebook)
- **Production:** To go live, you need to:
  - Submit your app for Meta review
  - Get approval for each product (WhatsApp, Instagram, Messenger)
  - This can take several days/weeks

---

**Need Help?**

- Meta Developer Docs: https://developers.facebook.com/docs
- WhatsApp API Docs: https://developers.facebook.com/docs/whatsapp
- Instagram API Docs: https://developers.facebook.com/docs/instagram
