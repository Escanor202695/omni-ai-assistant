import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { CustomerService } from '@/services/customer.service';
import { createCustomerSchema, listCustomersSchema } from '@/lib/validations';
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
    const params = listCustomersSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      search: searchParams.get('search'),
      tags: searchParams.get('tags'),
    });

    const result = await CustomerService.list(session.businessId, params);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[GET /api/customers]', error);
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
    const data = createCustomerSchema.parse(body);

    const customer = await CustomerService.create(session.businessId, data);
    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/customers] Error:', error);
    if (error.name === 'ZodError') {
      console.error('[POST /api/customers] Validation errors:', error.errors);
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('[POST /api/customers]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
