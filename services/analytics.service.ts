import { db } from '@/lib/db';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export class AnalyticsService {
  static async getDashboardMetrics(businessId: string) {
    const now = new Date();
    const last30Days = subDays(now, 30);
    const last7Days = subDays(now, 7);

    const [
      totalCustomers,
      totalConversations,
      activeConversations,
      totalAppointments,
      upcomingAppointments,
      recentConversations,
      recentAppointments,
      conversationTrend,
      appointmentTrend,
    ] = await Promise.all([
      // Total customers
      db.customer.count({ where: { businessId } }),
      
      // Total conversations
      db.conversation.count({ where: { businessId } }),
      
      // Active conversations
      db.conversation.count({ 
        where: { businessId, status: 'ACTIVE' } 
      }),
      
      // Total appointments
      db.appointment.count({ where: { businessId } }),
      
      // Upcoming appointments
      db.appointment.count({
        where: {
          businessId,
          startTime: { gte: now },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      
      // Recent conversations (last 7 days)
      db.conversation.count({
        where: {
          businessId,
          createdAt: { gte: last7Days },
        },
      }),
      
      // Recent appointments (last 7 days)
      db.appointment.count({
        where: {
          businessId,
          createdAt: { gte: last7Days },
        },
      }),
      
      // Conversation trend (last 30 days grouped by day)
      db.conversation.groupBy({
        by: ['createdAt'],
        where: {
          businessId,
          createdAt: { gte: last30Days },
        },
        _count: true,
      }),
      
      // Appointment trend
      db.appointment.groupBy({
        by: ['createdAt'],
        where: {
          businessId,
          createdAt: { gte: last30Days },
        },
        _count: true,
      }),
    ]);

    return {
      summary: {
        totalCustomers,
        totalConversations,
        activeConversations,
        totalAppointments,
        upcomingAppointments,
        recentConversations,
        recentAppointments,
      },
      trends: {
        conversations: conversationTrend,
        appointments: appointmentTrend,
      },
    };
  }

  static async getConversationMetrics(businessId: string, days = 30) {
    const startDate = subDays(new Date(), days);

    const [byChannel, byStatus, avgResponseTime] = await Promise.all([
      // Conversations by channel
      db.conversation.groupBy({
        by: ['channel'],
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      
      // Conversations by status
      db.conversation.groupBy({
        by: ['status'],
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        _count: true,
      }),
      
      // Average messages per conversation
      db.conversation.findMany({
        where: {
          businessId,
          createdAt: { gte: startDate },
        },
        include: {
          _count: {
            select: { messages: true },
          },
        },
        take: 100,
      }),
    ]);

    const avgMessages = avgResponseTime.reduce((acc, c) => acc + c._count.messages, 0) / (avgResponseTime.length || 1);

    return {
      byChannel,
      byStatus,
      avgMessages: Math.round(avgMessages * 10) / 10,
    };
  }
}
