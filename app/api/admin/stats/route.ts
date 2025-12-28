import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      businessCount,
      activeBusinessCount,
      userCount,
      conversationCount,
      customerCount,
      messageCount,
      totalIntegrations,
      activeIntegrations,
    ] = await Promise.all([
      db.business.count(),
      db.business.count({ where: { subscriptionStatus: 'ACTIVE' } }),
      db.user.count(),
      db.conversation.count(),
      db.customer.count(),
      db.message.count(),
      db.integration.count(),
      db.integration.count({ where: { isActive: true } }),
    ]);

    // Get businesses by subscription tier
    const businessesByTier = await db.business.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    });

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      recentBusinesses,
      recentUsers,
      recentConversations,
    ] = await Promise.all([
      db.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.conversation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return NextResponse.json({
      overview: {
        businesses: businessCount,
        activeBusinesses: activeBusinessCount,
        users: userCount,
        conversations: conversationCount,
        customers: customerCount,
        messages: messageCount,
        integrations: totalIntegrations,
        activeIntegrations,
      },
      subscriptionTiers: businessesByTier.reduce((acc, item) => {
        acc[item.subscriptionTier] = item._count;
        return acc;
      }, {} as Record<string, number>),
      recentActivity: {
        businesses: recentBusinesses,
        users: recentUsers,
        conversations: recentConversations,
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/stats]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

