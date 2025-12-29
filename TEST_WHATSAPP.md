# Testing WhatsApp Message Sending

## Method 1: Using cURL (Quick Test)

### Step 1: Get Your Access Token

Run this script to get your decrypted access token:

```bash
npx tsx scripts/get-integration-token.ts
```

This will show you:
- Your decrypted access token
- Your phone number ID
- Integration details

### Step 2: Send a Test Message

**For a regular text message:**

```bash
curl -i -X POST \
  "https://graph.facebook.com/v22.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "8801517310359",
    "type": "text",
    "text": {
      "body": "Hello! This is a test message from Omni AI Assistant 🚀"
    }
  }'
```

**Replace:**
- `YOUR_PHONE_NUMBER_ID` - From the script output (integration.platformId)
- `YOUR_ACCESS_TOKEN` - From the script output (decrypted token)
- `8801517310359` - Recipient phone number (with country code, no +)

**For a template message (like your example):**

```bash
curl -i -X POST \
  "https://graph.facebook.com/v22.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "8801517310359",
    "type": "template",
    "template": {
      "name": "jaspers_market_plain_text_v1",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

**Note:** Template messages require the template to be approved in your Meta App.

---

## Method 2: Using the Test Script

1. Edit `scripts/test-whatsapp-send.ts`:
   - Replace `ACCESS_TOKEN` with your decrypted token
   - Replace `PHONE_NUMBER_ID` with your phone number ID
   - Replace `TO_PHONE_NUMBER` with recipient number

2. Run:
   ```bash
   npx tsx scripts/test-whatsapp-send.ts
   ```

---

## Method 3: Through Your App (Recommended)

The webhook handler automatically sends responses when messages are received. To test:

1. **Send a message TO your WhatsApp Business number** (from a test phone)
2. The webhook will receive it at `/api/webhooks/meta`
3. AI will process and respond automatically
4. Check `/dashboard/conversations` to see the conversation

---

## Common Issues

### "Invalid OAuth access token"
- Your token might be expired
- Try reconnecting the integration: `/dashboard/integrations`
- Check token hasn't been revoked in Meta App

### "Invalid phone number"
- Make sure phone number includes country code (no +)
- Format: `8801517310359` (not `+8801517310359`)
- Number must be registered with WhatsApp

### "Template not found"
- Template must be created and approved in Meta App
- Go to WhatsApp → Message Templates in Meta App
- Use template name exactly as shown

### "Rate limit exceeded"
- Meta has rate limits on messaging
- Wait a few minutes and try again
- Check your Meta App dashboard for rate limit info

---

## Getting Phone Number ID

The phone number ID is stored in your Integration record as `platformId`. You can:

1. **From database:**
   ```bash
   npx tsx scripts/get-integration-token.ts
   ```

2. **From Meta App dashboard:**
   - Go to WhatsApp → API Setup
   - Copy "Phone number ID"

3. **From API:**
   ```bash
   curl -X GET "https://graph.facebook.com/v22.0/me/phone_numbers?access_token=YOUR_TOKEN"
   ```

---

## Testing End-to-End Flow

1. **Set up webhook** (if not done):
   - Use ngrok: `ngrok http 3000`
   - Configure webhook in Meta App with ngrok URL

2. **Send message to your WhatsApp Business number**

3. **Check webhook received it:**
   ```bash
   # Check WebhookLog table
   npx prisma studio
   # Or query database
   ```

4. **Check conversation created:**
   - Go to `/dashboard/conversations`
   - Should see new conversation

5. **Check AI response sent:**
   - Check recipient's WhatsApp
   - Should receive AI response

---

## Quick Test Command (All-in-One)

```bash
# 1. Get token and phone number ID
npx tsx scripts/get-integration-token.ts > /tmp/integration.txt

# 2. Extract values (manual step - copy from output)
# Then use in curl command above
```

---

**Pro Tip:** For development, use Meta's test phone numbers which don't require approval.

