import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { MetaWebhookPayload, MetaMessage } from '@/types';
import { CustomerService } from '@/services/customer.service';
import { ConversationService } from '@/services/conversation.service';
import { AIService } from '@/services/ai.service';
import { sendWhatsAppMessage, sendInstagramMessage, verifyWebhookSignature } from '@/lib/integrations/meta';
import { Channel, MessageRole } from '@prisma/client';

/**
 * Meta Webhook Handler
 * Handles incoming messages from WhatsApp, Instagram, and Facebook Messenger
 * 
 * GET: Webhook verification (Meta requires this for setup)
 * POST: Incoming messages
 */

// Webhook verification (GET)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// Webhook messages (POST)
export async function POST(req: NextRequest) {
  try {
    // Verify signature
    const signature = req.headers.get('x-hub-signature-256');
    const body = await req.text();

    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const payload: MetaWebhookPayload = JSON.parse(body);

    // Log webhook for debugging
    await db.webhookLog.create({
      data: {
        source: 'meta',
        event: payload.object,
        payload: payload as any,
      },
    });

    // Process asynchronously, return 200 immediately (Meta requires quick response)
    processWebhook(payload).catch((error) => {
      console.error('Error processing Meta webhook:', error);
    });

    return new NextResponse('OK', { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Process webhook payload
 */
async function processWebhook(payload: MetaWebhookPayload) {
  for (const entry of payload.entry) {
    // WhatsApp format (whatsapp_business_account)
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            if (message.type === 'text' && message.text?.body) {
              await handleWhatsAppMessage(
                change.value.metadata!.phone_number_id,
                message.from,
                message.text.body,
                message.id
              );
            }
          }
        }
      }
    }

    // Instagram/Facebook format (messaging)
    if (entry.messaging) {
      for (const event of entry.messaging) {
        if (event.message?.text) {
          await handleInstagramMessage(
            entry.id, // Page ID
            event.sender.id,
            event.message.text,
            event.message.mid
          );
        }
      }
    }
  }
}

/**
 * Handle incoming WhatsApp message
 */
async function handleWhatsAppMessage(
  phoneNumberId: string,
  from: string,
  text: string,
  messageId: string
) {
  try {
    // Find business by phone_number_id
    const integration = await db.integration.findFirst({
      where: {
        type: 'WHATSAPP',
        platformId: phoneNumberId,
        isActive: true,
      },
      include: { business: true },
    });

    if (!integration) {
      console.error(`No integration found for phone_number_id: ${phoneNumberId}`);
      return;
    }

    await handleMessage({
      businessId: integration.businessId,
      business: integration.business,
      integration,
      channel: 'WHATSAPP',
      platformSenderId: from,
      text,
      platformMessageId: messageId,
      sendResponse: async (response: string) => {
        await sendWhatsAppMessage({
          accessToken: decrypt(integration.accessToken),
          phoneNumberId,
          to: from,
          text: response,
        });
      },
    });
  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
  }
}

/**
 * Handle incoming Instagram message
 */
async function handleInstagramMessage(
  pageId: string,
  senderId: string,
  text: string,
  messageId: string
) {
  try {
    const integration = await db.integration.findFirst({
      where: {
        type: 'INSTAGRAM',
        platformId: pageId,
        isActive: true,
      },
      include: { business: true },
    });

    if (!integration) {
      console.error(`No integration found for page_id: ${pageId}`);
      return;
    }

    await handleMessage({
      businessId: integration.businessId,
      business: integration.business,
      integration,
      channel: 'INSTAGRAM',
      platformSenderId: senderId,
      text,
      platformMessageId: messageId,
      sendResponse: async (response: string) => {
        await sendInstagramMessage({
          accessToken: decrypt(integration.accessToken),
          recipientId: senderId,
          text: response,
          pageId,
        });
      },
    });
  } catch (error) {
    console.error('Error handling Instagram message:', error);
  }
}

/**
 * Core message handling logic (shared for all channels)
 */
async function handleMessage(params: {
  businessId: string;
  business: any;
  integration: any;
  channel: Channel;
  platformSenderId: string;
  text: string;
  platformMessageId: string;
  sendResponse: (response: string) => Promise<void>;
}) {
  const {
    businessId,
    business,
    channel,
    platformSenderId,
    text,
    platformMessageId,
    sendResponse,
  } = params;

  try {
    // 1. Find or create customer
    const customer = await CustomerService.findOrCreateByChannel(
      businessId,
      channel as 'WHATSAPP' | 'INSTAGRAM',
      platformSenderId,
      {
        phone: channel === 'WHATSAPP' ? platformSenderId : undefined,
      }
    );

    // 2. Get or create conversation
    const conversation = await ConversationService.getOrCreate(
      businessId,
      customer.id,
      channel
    );

    // 3. Save incoming message
    await ConversationService.addMessage(
      conversation.id,
      MessageRole.USER,
      text,
      {
        platformMessageId,
      }
    );

    // 4. Get conversation messages for context
    const conversationWithMessages = await ConversationService.getById(
      businessId,
      conversation.id
    );

    if (!conversationWithMessages) {
      throw new Error('Conversation not found');
    }

    // 5. Process with AI
    const aiResponse = await AIService.chat({
      business,
      customer,
      conversation,
      messages: conversationWithMessages.messages || [],
      userMessage: text,
    });

    // 6. Save AI response
    const messageMetadata: any = {
      latencyMs: aiResponse.latencyMs,
    };

    if ('tokenCount' in aiResponse) {
      messageMetadata.tokenCount = aiResponse.tokenCount;
      messageMetadata.model = aiResponse.model;
    }

    if ('toolCalls' in aiResponse) {
      messageMetadata.toolCalls = aiResponse.toolCalls;
      messageMetadata.toolResults = aiResponse.toolResults;
    }

    await ConversationService.addMessage(
      conversation.id,
      MessageRole.ASSISTANT,
      aiResponse.content,
      messageMetadata
    );

    // 7. Format response for channel (shorter for WhatsApp/Instagram)
    const formattedResponse = formatResponseForChannel(aiResponse.content, channel);

    // 8. Send response back
    await sendResponse(formattedResponse);

    // 9. Update business usage
    await db.business.update({
      where: { id: businessId },
      data: { monthlyInteractions: { increment: 1 } },
    });
  } catch (error) {
    console.error('Error in handleMessage:', error);
    // Try to send error message to user
    try {
      await sendResponse(
        'Sorry, I encountered an error processing your message. Please try again later.'
      );
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }
  }
}

/**
 * Format AI response for specific channel
 */
function formatResponseForChannel(content: string, channel: Channel): string {
  switch (channel) {
    case 'WHATSAPP':
    case 'INSTAGRAM':
      // Keep it concise for messaging apps
      if (content.length > 1600) {
        return content.substring(0, 1597) + '...';
      }
      return content;

    case 'FACEBOOK':
      // Similar to Instagram
      if (content.length > 2000) {
        return content.substring(0, 1997) + '...';
      }
      return content;

    default:
      return content;
  }
}

