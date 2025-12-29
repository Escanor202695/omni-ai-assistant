import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Check if VAPI keys are configured
    if (!process.env.VAPI_PRIVATE_KEY) {
      console.error('VAPI_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'VAPI not configured' },
        { status: 500 }
      );
    }

    console.log('VAPI_PRIVATE_KEY configured:', !!process.env.VAPI_PRIVATE_KEY);

    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      appointmentType,
      businessServices,
      businessHours,
      agentInstructions,
      aiPersonality = 'professional',
      aiGreeting = ''
    } = await request.json();

    // Validate required fields
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    // Build system prompt with customer context and business information
    const personalityMap: Record<string, string> = {
      professional: 'professional and helpful',
      friendly: 'warm and friendly',
      casual: 'casual and approachable',
      formal: 'formal and courteous'
    };

    const personalityDescription = personalityMap[aiPersonality] || 'professional and helpful';

    // Keep system prompt concise for better VAPI performance
    const systemPrompt = `You are a ${personalityDescription} AI receptionist.

Customer: ${customerName}
${businessServices ? `Services: ${businessServices}` : ''}
${businessHours ? `Hours: ${businessHours}` : ''}

Greet the customer warmly and help them with appointments or questions. Be concise and natural.`;

    // Use custom greeting if provided, otherwise use default
    const firstMessage = aiGreeting 
      ? `${aiGreeting.replace(/\{name\}/gi, customerName)}` 
      : `Hi ${customerName}! How can I help you today?`;

    console.log('Creating VAPI assistant with:', {
      firstMessage,
      systemPrompt: systemPrompt.substring(0, 200) + '...',
      personality: aiPersonality
    });

    // Create Vapi assistant with customer context - optimized for web calls
    const assistantConfig = {
      name: `Web Call Assistant for ${customerName}`,
      firstMessage: firstMessage,
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 250,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
        ],
      },
      voice: {
        provider: 'openai',
        voiceId: 'alloy',
        speed: 1.0,
      },
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US',
        smartFormat: true,
      },
      // WebRTC specific settings
      recordingEnabled: false,
      hipaaEnabled: false,
      // Add metadata for tracking
      metadata: {
        customerName,
        customerPhone,
        customerEmail: customerEmail || '',
        appointmentType: appointmentType || '',
        businessServices: businessServices || '',
        businessHours: businessHours || '',
        callType: 'web',
        createdAt: new Date().toISOString(),
      },
    };

    console.log('Creating VAPI assistant with config:', JSON.stringify(assistantConfig, null, 2));

    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assistantConfig),
    });

    console.log('VAPI API response status:', vapiResponse.status);

    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error('Vapi API error:', {
        status: vapiResponse.status,
        statusText: vapiResponse.statusText,
        error: errorData
      });
      return NextResponse.json(
        { error: 'Failed to create Vapi assistant', details: errorData },
        { status: vapiResponse.status }
      );
    }

    const assistant = await vapiResponse.json();
    console.log('VAPI assistant created successfully:', {
      id: assistant.id,
      name: assistant.name,
      model: assistant.model,
      voice: assistant.voice,
      transcriber: assistant.transcriber
    });

    // For testing/development, we'll use the web client approach
    // In production, you'd want to create an outbound call using a configured phone number
    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      message: 'Assistant created successfully. Use web client to start call.',
    });
  } catch (error) {
    console.error('Error creating Vapi assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
