import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { AnalyticsService } from '@/services/analytics.service';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins don't have a business - redirect them to admin
    if (session.role === UserRole.SUPER_ADMIN || !session.businessId) {
      return NextResponse.json({ error: 'Super admins cannot access business-specific routes' }, { status: 403 });
    }

    const metrics = await AnalyticsService.getDashboardMetrics(session.businessId);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[GET /api/analytics]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
