import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';

/**
 * GET /api/integrations
 * List all integrations for the current user's business
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await db.integration.findMany({
      where: {
        businessId: session.businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      data: integrations,
    });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}


