import { db } from '@/lib/db';
import { Channel, ConversationStatus, MessageRole } from '@prisma/client';

export class ConversationService {
  static async list(businessId: string, params: { 
    status?: string; 
    channel?: string; 
    page: number; 
    limit: number 
  }) {
    const { status, channel, page, limit } = params;
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      db.conversation.findMany({
        where: {
          businessId,
          ...(status && { status: status as ConversationStatus }),
          ...(channel && { channel: channel as Channel }),
        },
        include: {
          customer: true,
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
          _count: { select: { messages: true } },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      db.conversation.count({ 
        where: { 
          businessId,
          ...(status && { status: status as ConversationStatus }),
          ...(channel && { channel: channel as Channel }),
        } 
      }),
    ]);

    return { data: conversations, meta: { page, limit, total } };
  }

  static async getById(businessId: string, id: string) {
    return db.conversation.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        messages: { orderBy: { createdAt: 'asc' } },
        appointments: true,
      },
    });
  }

  static async getOrCreate(businessId: string, customerId: string, channel: Channel) {
    // Find active conversation or create new
    let conversation = await db.conversation.findFirst({
      where: { businessId, customerId, channel, status: 'ACTIVE' },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: { businessId, customerId, channel },
      });
    }

    return conversation;
  }

  static async addMessage(
    conversationId: string, 
    role: MessageRole, 
    content: string, 
    metadata?: { tokenCount?: number; latencyMs?: number; model?: string; toolCalls?: any; toolResults?: any; platformMessageId?: string }
  ) {
    const message = await db.message.create({
      data: {
        conversationId,
        role,
        content,
        ...metadata,
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  static async resolve(businessId: string, id: string) {
    return db.conversation.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  static async escalate(businessId: string, id: string, reason: string, userId?: string) {
    return db.conversation.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
        escalateReason: reason,
        assignedUserId: userId,
      },
    });
  }

  static async updateStatus(businessId: string, id: string, status: ConversationStatus) {
    return db.conversation.update({
      where: { id },
      data: { status },
    });
  }
}
