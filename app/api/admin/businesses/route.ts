import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { z } from 'zod';

const createBusinessSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  industry: z.enum(['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  timezone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const industry = searchParams.get('industry');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (industry) {
      where.industry = industry;
    }
    
    if (status) {
      where.subscriptionStatus = status;
    }

    const [businesses, total] = await Promise.all([
      db.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              users: true,
              customers: true,
              conversations: true,
              integrations: true,
            },
          },
        },
      }),
      db.business.count({ where }),
    ]);

    return NextResponse.json({
      data: businesses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/businesses]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = createBusinessSchema.parse(body);

    // Check if slug exists
    const existing = await db.business.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json({ error: 'Business with this slug already exists' }, { status: 400 });
    }

    const business = await db.business.create({
      data: {
        ...data,
        timezone: data.timezone || 'America/New_York',
      },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            conversations: true,
            integrations: true,
          },
        },
      },
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[POST /api/admin/businesses]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

