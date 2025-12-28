import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { ConversationService } from '@/services/conversation.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = {
      status: searchParams.get('status') || undefined,
      channel: searchParams.get('channel') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await ConversationService.list(session.businessId, params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/conversations]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, channel = 'WEBCHAT' } = body;

    const conversation = await ConversationService.getOrCreate(
      session.businessId,
      customerId,
      channel
    );

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('[POST /api/conversations]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
