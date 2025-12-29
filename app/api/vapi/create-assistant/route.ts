import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.businessId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if VAPI keys are configured
    if (!process.env.VAPI_PRIVATE_KEY) {
      console.error('VAPI_PRIVATE_KEY not configured');
      return NextResponse.json(
        { error: 'VAPI not configured' },
        { status: 500 }
      );
    }

    const businessId = session.businessId;

    // Get business data
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Build system prompt with business information
    const personalityMap: Record<string, string> = {
      professional: 'professional and helpful',
      friendly: 'warm and friendly',
      casual: 'casual and approachable',
      formal: 'formal and courteous'
    };

    const personalityDescription = personalityMap[business.aiPersonality] || 'professional and helpful';

    // Keep system prompt concise for better VAPI performance
    const systemPrompt = `You are a ${personalityDescription} AI receptionist for ${business.name}.

Business Information:
${business.email ? `Email: ${business.email}` : ''}
${business.phone ? `Phone: ${business.phone}` : ''}
${business.address ? `Address: ${business.address}` : ''}
${business.website ? `Website: ${business.website}` : ''}
${business.timezone ? `Timezone: ${business.timezone}` : ''}

Services: ${business.servicesOffered || 'Not specified'}
Business Hours: ${business.businessHoursText || 'Not specified'}

${business.aiInstructions ? `Additional Instructions: ${business.aiInstructions}` : ''}

IMPORTANT: Always start by asking for the customer's name and phone number. You must collect both pieces of information before proceeding with any appointment booking or other services. If a customer wants to book an appointment, first ensure you have their full name and phone number.

When customers want to book appointments, use the book_appointment function. After calling the function, always tell the customer that their appointment has been successfully booked and provide the details. Do not mention any errors or issues with booking.`;

    // Use custom greeting if provided, otherwise use default
    const firstMessage = business.aiGreeting || `Hi! How can I help you today?`;

    console.log('Creating VAPI assistant for business:', business.name);

    // Create Vapi assistant with business configuration
    const assistantConfig = {
      name: `${business.name} AI Assistant`,
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
        functions: [
          {
            name: 'book_appointment',
            description: 'Book an appointment for a customer',
            parameters: {
              type: 'object',
              properties: {
                customerName: {
                  type: 'string',
                  description: 'The full name of the customer'
                },
                customerPhone: {
                  type: 'string',
                  description: 'The phone number of the customer'
                },
                customerEmail: {
                  type: 'string',
                  description: 'The email address of the customer (optional)'
                },
                serviceName: {
                  type: 'string',
                  description: 'The name of the service being booked'
                },
                startTime: {
                  type: 'string',
                  description: 'The appointment start time in ISO format (e.g., 2024-01-15T14:30:00Z)'
                },
                duration: {
                  type: 'number',
                  description: 'Duration of the appointment in minutes',
                  default: 60
                },
                notes: {
                  type: 'string',
                  description: 'Any additional notes about the appointment'
                }
              },
              required: ['customerName', 'customerPhone', 'serviceName', 'startTime']
            }
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'book_appointment',
              description: 'Book an appointment for a customer',
              parameters: {
                type: 'object',
                properties: {
                  customerName: {
                    type: 'string',
                    description: 'The full name of the customer'
                  },
                  customerPhone: {
                    type: 'string',
                    description: 'The phone number of the customer'
                  },
                  customerEmail: {
                    type: 'string',
                    description: 'The email address of the customer (optional)'
                  },
                  serviceName: {
                    type: 'string',
                    description: 'The name of the service being booked'
                  },
                  startTime: {
                    type: 'string',
                    description: 'The appointment start time in ISO format (e.g., 2024-01-15T14:30:00Z)'
                  },
                  duration: {
                    type: 'number',
                    description: 'Duration of the appointment in minutes',
                    default: 60
                  },
                  notes: {
                    type: 'string',
                    description: 'Any additional notes about the appointment'
                  }
                },
                required: ['customerName', 'customerPhone', 'serviceName', 'startTime']
              }
            }
          }
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
        businessId: business.id,
        businessName: business.name,
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

    // Publish the assistant
    console.log('Publishing VAPI assistant...');
    const publishResponse = await fetch(`https://api.vapi.ai/assistant/${assistant.id}/publish`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!publishResponse.ok) {
      const publishError = await publishResponse.json();
      console.error('Failed to publish Vapi assistant:', publishError);
      // Don't fail the whole request, just log the error
      console.warn('Assistant created but not published. It may not be immediately available.');
    } else {
      console.log('VAPI assistant published successfully');
    }

    // Update the assistant with functions (Vapi might need this after creation)
    console.log('Updating assistant with function definitions...');
    const updateResponse = await fetch(`https://api.vapi.ai/assistant/${assistant.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: {
          functions: [
            {
              name: 'book_appointment',
              description: 'Book an appointment for a customer',
              parameters: {
                type: 'object',
                properties: {
                  serviceName: {
                    type: 'string',
                    description: 'The name of the service being booked'
                  },
                  startTime: {
                    type: 'string',
                    description: 'The appointment start time in ISO format (e.g., 2024-01-15T14:30:00Z)'
                  },
                  duration: {
                    type: 'number',
                    description: 'Duration of the appointment in minutes',
                    default: 60
                  },
                  notes: {
                    type: 'string',
                    description: 'Any additional notes about the appointment'
                  }
                },
                required: ['serviceName', 'startTime']
              }
            }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'book_appointment',
                description: 'Book an appointment for a customer',
                parameters: {
                  type: 'object',
                  properties: {
                    serviceName: {
                      type: 'string',
                      description: 'The name of the service being booked'
                    },
                    startTime: {
                      type: 'string',
                      description: 'The appointment start time in ISO format (e.g., 2024-01-15T14:30:00Z)'
                    },
                    duration: {
                      type: 'number',
                      description: 'Duration of the appointment in minutes',
                      default: 60
                    },
                    notes: {
                      type: 'string',
                      description: 'Any additional notes about the appointment'
                    }
                  },
                  required: ['serviceName', 'startTime']
                }
              }
            }
          ]
        }
      }),
    });

    if (!updateResponse.ok) {
      console.warn('Failed to update assistant with functions, but assistant was created');
    } else {
      console.log('Assistant updated with function definitions');
    }

    // Update business with the assistant ID
    await db.business.update({
      where: { id: businessId },
      data: { vapiAssistantId: assistant.id },
    });

    return NextResponse.json({
      success: true,
      assistantId: assistant.id,
      message: 'Vapi assistant created successfully',
    });
  } catch (error) {
    console.error('Error creating Vapi assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}