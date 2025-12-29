import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { BusinessService } from '@/services/business.service';
import { CustomerService } from '@/services/customer.service';
import { ConversationService } from '@/services/conversation.service';
import { AIService } from '@/services/ai.service';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check for session (for authenticated users) OR allow anonymous
    const session = await getServerSession();
    
    const body = await req.json();
    const { message, customerId, conversationId, businessId: publicBusinessId } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Determine businessId (from session or public request)
    const businessId = session?.businessId || publicBusinessId;
    
    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 });
    }

    // Get business
    const business = await db.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Get or create customer
    let customer;
    if (customerId) {
      customer = await db.customer.findFirst({
        where: { id: customerId, businessId },
      });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.conversation.findFirst({
        where: { id: conversationId, businessId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    } else if (customer) {
      conversation = await ConversationService.getOrCreate(
        businessId,
        customer.id,
        'WEBCHAT'
      );
      conversation = await db.conversation.findFirst({
        where: { id: conversation.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    } else {
      return NextResponse.json({ error: 'Customer or conversation required' }, { status: 400 });
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Add user message
    await ConversationService.addMessage(conversation.id, 'USER', message);

    // Get AI response
    const aiResponse = await AIService.chat({
      business,
      customer: customer || null,
      conversation,
      messages: conversation.messages,
      userMessage: message,
    });

    // Save AI message
    await ConversationService.addMessage(
      conversation.id,
      'ASSISTANT',
      aiResponse.content,
      {
        tokenCount: 'tokenCount' in aiResponse ? aiResponse.tokenCount : undefined,
        latencyMs: aiResponse.latencyMs,
        model: 'model' in aiResponse ? aiResponse.model : undefined,
      }
    );

    // Increment usage
    await BusinessService.incrementUsage(businessId, 'interactions');

    return NextResponse.json({
      message: aiResponse.content,
      conversationId: conversation.id,
      customerId: customer?.id,
      metadata: {
        tokenCount: 'tokenCount' in aiResponse ? aiResponse.tokenCount : undefined,
        latencyMs: aiResponse.latencyMs,
        model: 'model' in aiResponse ? aiResponse.model : undefined,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/chat]', error);
    return NextResponse.json({ 
      error: error.message || 'Internal error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
