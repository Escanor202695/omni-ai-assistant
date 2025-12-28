# Vapi Voice Call Integration

This project includes a voice call simulation feature powered by Vapi AI for testing voice agent interactions.

## Features

- **Voice Call Simulation**: Test incoming calls with a virtual AI receptionist
- **Customer Context**: Provide customer information that the AI uses during conversation
- **Live Transcription**: See real-time transcripts of the conversation
- **Call Management**: Start, monitor, and end calls with a clean UI

## Setup

### 1. Environment Variables

Add your Vapi credentials to `.env.local`:

```bash
VAPI_PUBLIC_KEY=your_public_key
VAPI_PRIVATE_KEY=your_private_key
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_public_key
```

### 2. Usage

1. Navigate to the **Conversations** page in your dashboard
2. Click the **"Simulate Incoming Call"** button
3. Fill in the customer information form:
   - **Customer Name** (required)
   - **Phone Number** (required)
   - **Email** (optional)
   - **Appointment Type** (optional)
4. Click **"Start Call"** to initiate the voice conversation
5. Speak naturally with the AI agent
6. View the live transcript as the conversation progresses
7. Click **"End Call"** when finished

## How It Works

### Client-Side (Web SDK)

The `VoiceCallDialog` component uses the Vapi Web SDK (`@vapi-ai/web`) to:
- Initialize a Vapi client with your public API key
- Start voice calls with a specific assistant
- Listen for call events (start, end, transcripts)
- Display real-time conversation updates

### Server-Side (API Route)

The `/api/vapi/start-call` endpoint:
1. Receives customer information from the form
2. Creates a custom Vapi assistant with a personalized system prompt
3. Injects customer context into the assistant's knowledge
4. Returns the assistant ID to the client for call initiation

### Assistant Configuration

Each call creates a unique assistant configured with:
- **Model**: GPT-4o-mini for fast, cost-effective responses
- **Voice**: PlayHT Jennifer voice for natural speech
- **Transcriber**: Deepgram Nova-2 for accurate speech recognition
- **Context**: Customer name, phone, email, and appointment preferences

## Customization

### Modify the System Prompt

Edit the system prompt in `/app/api/vapi/start-call/route.ts`:

```typescript
const systemPrompt = `You are a friendly and professional AI receptionist...`;
```

### Change Voice Settings

Update the voice configuration:

```typescript
voice: {
  provider: 'playht',  // or '11labs', 'azure', etc.
  voiceId: 'jennifer', // choose different voice ID
},
```

### Adjust Model Settings

Modify the language model:

```typescript
model: {
  provider: 'openai',
  model: 'gpt-4o-mini',  // or 'gpt-4o', 'claude-3-5-sonnet', etc.
  temperature: 0.7,
},
```

## API Reference

### Vapi Web SDK Events

- `call-start`: Fired when the call begins
- `call-end`: Fired when the call ends
- `message`: Fired for each transcript message
- `error`: Fired on errors

### Vapi API Endpoints

- `POST /assistant`: Create a new assistant
- `GET /assistant/:id`: Get assistant details
- `DELETE /assistant/:id`: Delete an assistant

## Troubleshooting

### Call Not Starting

- Check that `NEXT_PUBLIC_VAPI_PUBLIC_KEY` is set correctly
- Ensure microphone permissions are granted in your browser
- Verify the Vapi API keys are valid

### Audio Issues

- Allow microphone access when prompted
- Check browser audio settings
- Try using Chrome or Edge (recommended browsers)

### Assistant Creation Fails

- Verify `VAPI_PRIVATE_KEY` is set in `.env.local`
- Check API key permissions in your Vapi dashboard
- Review server logs for detailed error messages

## Resources

- [Vapi Documentation](https://docs.vapi.ai)
- [Vapi Dashboard](https://dashboard.vapi.ai)
- [Vapi Web SDK GitHub](https://github.com/VapiAI/web)
- [Vapi Discord Community](https://discord.gg/pUFNcf2WmH)
