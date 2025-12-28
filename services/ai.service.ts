import { openrouter, MODELS } from '@/lib/openrouter';
import { RAGService } from './rag.service';
import { Business, Customer, Conversation, Message } from '@prisma/client';
import { AppointmentService } from './appointment.service';
import { ConversationService } from './conversation.service';

interface ChatParams {
  business: Business;
  customer: Customer | null;
  conversation: Conversation;
  messages: Message[];
  userMessage: string;
}

export class AIService {
  static async chat(params: ChatParams) {
    const { business, customer, conversation, messages, userMessage } = params;

    // 1. Get relevant knowledge
    const context = await RAGService.search(business.id, userMessage);

    // 2. Build system prompt
    const systemPrompt = this.buildSystemPrompt(business, customer, context);

    // 3. Format message history
    const chatMessages = this.formatMessages(messages, userMessage, systemPrompt);

    // 4. Call LLM
    const startTime = Date.now();
    const response = await openrouter.chat.completions.create({
      model: MODELS.PRIMARY,
      messages: chatMessages,
      tools: this.getTools(),
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const latencyMs = Date.now() - startTime;
    const choice = response.choices[0];

    // 5. Handle tool calls if any
    if (choice.message.tool_calls?.length) {
      return await this.handleToolCalls(choice.message.tool_calls, params, latencyMs);
    }

    return {
      content: choice.message.content || '',
      tokenCount: response.usage?.total_tokens,
      latencyMs,
      model: response.model,
    };
  }

  private static buildSystemPrompt(
    business: Business,
    customer: Customer | null,
    context: string
  ): string {
    return `You are the AI assistant for ${business.name}, a ${business.industry.toLowerCase()} business.

BUSINESS INFORMATION:
- Name: ${business.name}
- Phone: ${business.phone || 'Not provided'}
- Email: ${business.email || 'Not provided'}
- Address: ${business.address || 'Not provided'}
- Website: ${business.website || 'Not provided'}
- Hours: ${this.formatHours(business.businessHours)}

RELEVANT KNOWLEDGE:
${context || 'No specific knowledge available.'}

CUSTOMER CONTEXT:
- Name: ${customer?.name || 'Unknown'}
- Previous visits: ${customer?.visitCount || 0}
${customer?.notes ? `- Notes: ${customer.notes}` : ''}

YOUR CAPABILITIES:
1. Answer questions using the knowledge above
2. Check appointment availability
3. Book appointments
4. Escalate to human when needed

RULES:
- Be helpful, ${business.aiPersonality || 'professional'}, and concise
- Use the knowledge base to answer accurately
- Don't make up information
- For appointments, always confirm date, time, and service
- Escalate complaints or complex issues to human
${business.aiInstructions ? `\nADDITIONAL INSTRUCTIONS:\n${business.aiInstructions}` : ''}`;
  }

  private static getTools() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'check_availability',
          description: 'Check available appointment slots for a specific date',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
              serviceId: { type: 'string', description: 'Optional service ID' },
            },
            required: ['date'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'book_appointment',
          description: 'Book an appointment',
          parameters: {
            type: 'object',
            properties: {
              date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
              time: { type: 'string', description: 'Time in HH:MM format' },
              serviceName: { type: 'string' },
              customerName: { type: 'string' },
              customerPhone: { type: 'string' },
              customerEmail: { type: 'string' },
            },
            required: ['date', 'time', 'serviceName'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'escalate_to_human',
          description: 'Transfer conversation to human agent',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
            },
            required: ['reason'],
          },
        },
      },
    ];
  }

  private static formatMessages(messages: Message[], userMessage: string, systemPrompt: string) {
    return [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-10).map(m => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];
  }

  private static formatHours(hours: any): string {
    if (!hours || typeof hours !== 'object') return 'Not specified';
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const formatted = days
        .filter(day => hours[day]?.open && hours[day]?.close)
        .map(day => `${day}: ${hours[day].open} - ${hours[day].close}`)
        .join(', ');
      return formatted || 'Not specified';
    } catch {
      return 'Not specified';
    }
  }

  private static async handleToolCalls(toolCalls: any[], params: ChatParams, latencyMs: number) {
    const { business, conversation } = params;
    const results: any[] = [];

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);

      switch (toolCall.function.name) {
        case 'check_availability':
          // Would call AppointmentService.getAvailability
          results.push(`Available slots on ${args.date}: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM`);
          break;

        case 'book_appointment':
          // Would call AppointmentService.create
          results.push(`Appointment booked for ${args.date} at ${args.time} for ${args.serviceName}`);
          break;

        case 'escalate_to_human':
          await ConversationService.escalate(business.id, conversation.id, args.reason);
          results.push('Conversation escalated to human agent');
          break;
      }
    }

    return {
      content: results.join('\n'),
      toolCalls,
      toolResults: results,
      latencyMs,
    };
  }
}
