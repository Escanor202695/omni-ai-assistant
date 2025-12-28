# Meta Webhook Implementation - Complete ✅

## What Was Implemented

### 1. Meta Webhook Types (`types/index.ts`)
- ✅ `MetaWebhookPayload` - Main webhook payload structure
- ✅ `MetaMessage` - WhatsApp message structure
- ✅ `MetaMessageStatus` - Message status updates

### 2. Meta API Helpers (`lib/integrations/meta.ts`)
- ✅ `sendWhatsAppMessage()` - Send messages via WhatsApp Business API
- ✅ `sendInstagramMessage()` - Send messages via Instagram DM API
- ✅ `verifyWebhookSignature()` - Verify Meta webhook signatures for security

### 3. Webhook Handler (`app/api/webhooks/meta/route.ts`)
- ✅ **GET endpoint** - Webhook verification (required by Meta for setup)
- ✅ **POST endpoint** - Handles incoming messages
- ✅ WhatsApp message processing
- ✅ Instagram message processing
- ✅ Message signature verification
- ✅ Webhook logging for debugging
- ✅ Error handling and async processing

### 4. Customer Service Updates (`services/customer.service.ts`)
- ✅ `findOrCreateByChannel()` - Find/create customers by channel-specific IDs (whatsappId, instagramId, facebookId)
- ✅ Cross-channel identity linking (finds by phone number if channel ID not found)

## How It Works

### Message Flow

1. **Meta sends webhook** → `POST /api/webhooks/meta`
2. **Verify signature** → Ensures request is from Meta
3. **Log webhook** → Store in `WebhookLog` table for debugging
4. **Parse payload** → Extract message data (different format for WhatsApp vs Instagram)
5. **Find business** → Look up Integration by `platformId` (phone_number_id or page_id)
6. **Find/create customer** → Use channel-specific ID (whatsappId, instagramId)
7. **Get/create conversation** → Active conversation for customer + channel
8. **Save incoming message** → Store user message in database
9. **Process with AI** → Call AIService.chat() with context
10. **Save AI response** → Store assistant message
11. **Format for channel** → Shorten if needed (WhatsApp/Instagram have limits)
12. **Send response** → Use Meta API to send message back
13. **Update usage** → Increment business monthlyInteractions

### Webhook Verification Flow

1. **Meta requests verification** → `GET /api/webhooks/meta?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...`
2. **Check token** → Compare with `META_WEBHOOK_VERIFY_TOKEN` env var
3. **Return challenge** → Meta confirms webhook is valid

## Environment Variables Required

Add these to your `.env` file:

```bash
# Meta App Configuration
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_WEBHOOK_VERIFY_TOKEN=your-random-verify-token

# Encryption (already set up)
ENCRYPTION_KEY=your-64-char-hex-key
```

## Next Steps

### 1. Set Up Meta Developer App
You need to:
1. Create a Meta Developer account
2. Create a Meta App (Business type)
3. Add products: WhatsApp Business API, Instagram Messaging
4. Configure webhook URL: `https://yourdomain.com/api/webhooks/meta`
5. Set webhook verify token (must match `META_WEBHOOK_VERIFY_TOKEN`)
6. Subscribe to webhook fields:
   - WhatsApp: `messages`
   - Instagram: `messaging`

### 2. Create OAuth Integration Routes
Still needed:
- `app/api/integrations/meta/connect/route.ts` - Start OAuth flow
- `app/api/integrations/meta/callback/route.ts` - Handle OAuth callback
- `app/(dashboard)/integrations/page.tsx` - UI to connect/disconnect

### 3. Test the Webhook

**Using ngrok for local testing:**
```bash
# Start your Next.js app
npm run dev

# In another terminal, expose to internet
ngrok http 3000

# Use the ngrok URL in Meta webhook settings:
# https://your-ngrok-url.ngrok.io/api/webhooks/meta
```

**Test with Meta's test tools:**
- Use Meta's webhook testing tool in Developer Console
- Send test messages from Meta's test phone numbers

## Database Requirements

Make sure your database has:
- ✅ `Integration` model (already in schema)
- ✅ `Customer` model with `whatsappId`, `instagramId`, `facebookId` fields
- ✅ `Conversation` model with `channel` field
- ✅ `Message` model
- ✅ `WebhookLog` model

All of these are already in your schema! ✅

## API Endpoints

### Webhook Endpoint
- **GET** `/api/webhooks/meta` - Webhook verification
- **POST** `/api/webhooks/meta` - Receive messages

## Error Handling

The webhook handler includes:
- ✅ Signature verification (returns 401 if invalid)
- ✅ Async processing (returns 200 immediately, processes in background)
- ✅ Error logging to console
- ✅ Webhook logging to database
- ✅ Graceful error messages to users if processing fails

## Testing Checklist

- [ ] Set up Meta Developer App
- [ ] Configure webhook URL in Meta Console
- [ ] Set `META_WEBHOOK_VERIFY_TOKEN` in .env
- [ ] Test webhook verification (GET request)
- [ ] Create Integration record in database (manually or via OAuth)
- [ ] Send test message from WhatsApp
- [ ] Verify message is received and processed
- [ ] Verify AI response is sent back
- [ ] Check WebhookLog table for entries
- [ ] Check Conversation and Message records created

## Notes

- The webhook handler processes messages asynchronously to meet Meta's 20-second response requirement
- Messages are logged to `WebhookLog` table for debugging
- Customer identity is linked across channels using phone numbers
- AI responses are automatically shortened for WhatsApp/Instagram (1600 char limit)
- Usage is tracked per business (monthlyInteractions counter)

---

**Status:** ✅ Ready for testing once Meta Developer App is set up!

