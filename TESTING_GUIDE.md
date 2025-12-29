# Testing Meta Integration - Quick Guide

## Test 1: Send a message to your Facebook Page

1. Open Facebook Messenger on your phone or at https://www.facebook.com/messages
2. Search for one of your pages:
   - Instaquirk
   - Azirr
   - Aurora Charms
   - Porisima- পরিসীমা
   - Unpleasant Truths
3. Send a message like: "Hello! Can you help me?"
4. Wait a few seconds
5. You should get an AI response automatically

## Test 2: Check webhook logs

Watch your terminal where `npm run dev` is running. You should see:
- Webhook received
- Customer created/found
- Conversation created
- AI processing
- Response sent

## Test 3: Check the dashboard

1. Go to: http://localhost:3000/dashboard/conversations
2. You should see a new conversation
3. Open it to see the messages
4. Check http://localhost:3000/dashboard/customers for the new customer

## What happens when someone messages your page

1. **Message sent** → User messages your Facebook page
2. **Webhook triggered** → Meta calls `/api/webhooks/meta`
3. **Customer created** → System finds/creates customer record
4. **Conversation created** → New conversation in database
5. **AI processes** → AIService.chat() with RAG context
6. **Response sent** → AI replies via Meta API
7. **Everything logged** → Appears in dashboard

## Troubleshooting

### No response received?
Check terminal logs for errors:
```bash
# Check if webhook was received
tail -f ~/.cursor/projects/.../terminals/4.txt
```

### "Invalid signature" error?
- Make sure META_APP_SECRET is correct in .env
- Restart app after changing .env

### No webhook logs at all?
- Check ngrok is running: `curl http://localhost:4040/api/tunnels`
- Verify webhook URL in Meta matches ngrok URL
- Make sure page is subscribed to messages

### Database errors?
- Check Prisma connection: `npx prisma db push`
- Make sure all env variables are set

## Quick verification

Check if webhook endpoint is working:
```bash
curl "http://localhost:3000/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=fe67c015511dfbaa1062f86821c8f757b4b2e0dd0ca3e243a0d4a04b8ef3f483&hub.challenge=test"
```

Should return: `test`

## Success looks like

Terminal should show:
```
GET /api/webhooks/meta 200 in 150ms
prisma:query INSERT INTO "Customer" ...
prisma:query INSERT INTO "Conversation" ...
prisma:query INSERT INTO "Message" ...
AI processing...
Sending response...
```

Dashboard should show:
- New conversation in /conversations
- New customer in /customers
- Messages with AI responses

---

**Ready to test!** Send a message to any of your 5 Facebook pages.

