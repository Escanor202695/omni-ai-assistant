import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { BusinessService } from '@/services/business.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await BusinessService.getById(session.businessId);

    return NextResponse.json({
      user: {
        userId: session.userId,
        email: session.email,
        role: session.role,
      },
      business,
    });
  } catch (error) {
    console.error('[GET /api/auth/me]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
