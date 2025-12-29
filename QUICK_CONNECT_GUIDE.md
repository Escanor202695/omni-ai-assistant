# Quick Guide: Connect Meta Platforms in 5 Steps

## 🚀 Quick Start

### Step 1: Create Meta Developer App (5 minutes)

1. Go to https://developers.facebook.com/apps
2. Click **"Create App"** → Select **"Business"**
3. Fill in app name and email → Click **"Create App"**

### Step 2: Get Your Credentials (2 minutes)

1. In your Meta App dashboard, go to **Settings** → **Basic**
2. Copy:
   - **App ID** 
   - **App Secret** (click "Show" to reveal)

3. Generate a webhook token:
   ```bash
   openssl rand -hex 32
   ```
   Copy this token.

### Step 3: Add Environment Variables (1 minute)

Add to your `.env` file:

```bash
META_APP_ID=your-app-id-here
META_APP_SECRET=your-app-secret-here
META_WEBHOOK_VERIFY_TOKEN=your-generated-token-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 4: Configure OAuth Redirect (2 minutes)

1. In Meta App → **Settings** → **Basic**
2. Click **"Add Platform"** → **"Website"**
3. Add Site URL: `http://localhost:3000`

4. Go to **Products** → **Facebook Login** → **Settings**
5. Add **Valid OAuth Redirect URIs:**
   ```
   http://localhost:3000/api/integrations/meta/callback
   ```
6. Click **"Save Changes"**

### Step 5: Connect from Your App (1 minute)

1. Start your app:
   ```bash
   npm run dev
   ```

2. Go to: `http://localhost:3000/dashboard/integrations`

3. Click **"Connect WhatsApp"** (or Instagram/Facebook)

4. Log in with Facebook and authorize

5. Done! ✅ Platform is now connected

---

## 📱 For WhatsApp Specifically

After Step 5, you also need to:

1. In Meta App → **WhatsApp** → **Get Started**
2. Create a WhatsApp Business Account
3. Add a phone number (use Meta's test number for testing)

---

## 🔗 For Webhooks (To Receive Messages)

### Local Development (using ngrok):

1. Install ngrok: `brew install ngrok` (Mac)
2. Start your app: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

5. In Meta App → **WhatsApp** → **Configuration** → **Webhook**:
   - Callback URL: `https://your-ngrok-url.ngrok.io/api/webhooks/meta`
   - Verify Token: (same as `META_WEBHOOK_VERIFY_TOKEN`)
   - Click **"Verify and Save"**
   - Subscribe to **"messages"**

---

## ✅ Checklist

- [ ] Meta Developer App created
- [ ] App ID and Secret copied
- [ ] Webhook token generated
- [ ] Environment variables added to `.env`
- [ ] OAuth redirect URI configured
- [ ] App restarted (`npm run dev`)
- [ ] Clicked "Connect" button
- [ ] Authorized on Meta
- [ ] Platform shows as "Connected"

---

## 🐛 Common Issues

**"OAuth authentication failed"**
→ Check that `META_APP_ID` and `META_APP_SECRET` are correct in `.env`
→ Make sure OAuth redirect URI is configured in Meta App

**"No access token received"**
→ Make sure your Meta App is in "Development" mode
→ Check that you granted all permissions

**Button doesn't work / Nothing happens**
→ Check browser console for errors
→ Make sure environment variables are loaded (restart app)
→ Check that `NEXT_PUBLIC_APP_URL` is set

---

**That's it!** Once connected, messages will flow through the webhook automatically.

For detailed setup, see `META_SETUP_GUIDE.md`


