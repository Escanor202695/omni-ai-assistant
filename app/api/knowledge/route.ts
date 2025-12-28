import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { KnowledgeService } from '@/services/knowledge.service';
import { createKnowledgeDocSchema } from '@/lib/validations';
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

    const { searchParams } = new URL(req.url);
    const params = {
      docType: searchParams.get('docType') as any,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    };

    const result = await KnowledgeService.list(session.businessId, params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/knowledge]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Super admins don't have a business - redirect them to admin
    if (session.role === UserRole.SUPER_ADMIN || !session.businessId) {
      return NextResponse.json({ error: 'Super admins cannot access business-specific routes' }, { status: 403 });
    }

    const body = await req.json();
    const data = createKnowledgeDocSchema.parse(body);

    const doc = await KnowledgeService.create(session.businessId, data);
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('[POST /api/knowledge]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
