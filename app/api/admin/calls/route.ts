import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // Get business to find Vapi assistant ID
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { vapiAssistantId: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (!business.vapiAssistantId) {
      return NextResponse.json({
        data: [],
        meta: { page, limit, total: 0, totalPages: 0 }
      });
    }

    // Fetch calls from Vapi API filtered by assistant ID
    const vapiResponse = await fetch(
      `https://api.vapi.ai/call?assistantId=${business.vapiAssistantId}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!vapiResponse.ok) {
      console.error('Vapi API error:', await vapiResponse.text());
      return NextResponse.json({ error: 'Failed to fetch calls from Vapi' }, { status: 500 });
    }

    const calls = await vapiResponse.json();

    return NextResponse.json({
      data: calls || [],
      meta: {
        page,
        limit,
        total: calls?.length || 0,
        totalPages: Math.ceil((calls?.length || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching calls:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}