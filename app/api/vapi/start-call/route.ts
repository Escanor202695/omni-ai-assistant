import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { 
      customerName, 
      customerPhone, 
      customerEmail, 
      appointmentType,
      businessServices,
      businessHours,
      agentInstructions 
    } = await request.json();

    // Validate required fields
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      );
    }

    // Build system prompt with customer context and business information
    const systemPrompt = `You are a friendly and professional AI receptionist for a business.

Customer Information:
- Name: ${customerName}
- Phone: ${customerPhone}
${customerEmail ? `- Email: ${customerEmail}` : ''}
${appointmentType ? `- Interested in: ${appointmentType}` : ''}

${businessServices ? `Services We Offer:\n${businessServices}\n` : ''}
${businessHours ? `Business Hours:\n${businessHours}\n` : ''}
${agentInstructions ? `Special Instructions:\n${agentInstructions}\n` : ''}

Your responsibilities:
1. Greet the customer warmly by name
2. Ask how you can help them today
3. If they want to book an appointment:
   - Confirm the service type they're interested in
   - Check their availability and suggest times
   - Collect any additional information needed
4. Answer questions about services, hours, and pricing using the information provided above
5. Be concise and natural in your responses
6. If you need to transfer to a human, politely let them know

Keep your responses under 30 words when possible. Be warm, professional, and helpful.`;

    // Create Vapi assistant with customer context
    const vapiResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Assistant for ${customerName}`,
        firstMessage: `Hi ${customerName}! Thanks for calling. How can I help you today?`,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0.7,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
          ],
        },
        voice: {
          provider: 'playht',
          voiceId: 'jennifer',
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: 'en',
        },
        // Add metadata for tracking
        metadata: {
          customerName,
          customerPhone,
          customerEmail: customerEmail || '',
          appointmentType: appointmentType || '',
          businessServices: businessServices || '',
          businessHours: businessHours || '',
          createdAt: new Date().toISOString(),
        },
      }),
    });

    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error('Vapi API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Vapi assistant', details: errorData },
        { status: vapiResponse.status }
      );
    }

    const assistant = await vapiResponse.json();

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      message: 'Assistant created successfully',
    });
  } catch (error) {
    console.error('Error creating Vapi assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
