import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { KnowledgeService } from '@/services/knowledge.service';
import { UserRole } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === UserRole.SUPER_ADMIN || !session.businessId) {
      return NextResponse.json({ error: 'Super admins cannot access business-specific routes' }, { status: 403 });
    }

    const doc = await KnowledgeService.getById(session.businessId, params.id);
    
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error('[GET /api/knowledge/[id]]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === UserRole.SUPER_ADMIN || !session.businessId) {
      return NextResponse.json({ error: 'Super admins cannot access business-specific routes' }, { status: 403 });
    }

    const body = await req.json();
    const doc = await KnowledgeService.update(session.businessId, params.id, body);

    return NextResponse.json(doc);
  } catch (error) {
    console.error('[PUT /api/knowledge/[id]]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role === UserRole.SUPER_ADMIN || !session.businessId) {
      return NextResponse.json({ error: 'Super admins cannot access business-specific routes' }, { status: 403 });
    }

    await KnowledgeService.delete(session.businessId, params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/knowledge/[id]]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

