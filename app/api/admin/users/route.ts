import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateUserSchema = z.object({
  role: z.enum(['SUPER_ADMIN', 'BUSINESS_OWNER', 'TEAM_MEMBER']).optional(),
  name: z.string().optional().nullable(),
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
    const role = searchParams.get('role');
    const businessId = searchParams.get('businessId');

    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role) {
      where.role = role;
    }
    
    if (businessId) {
      where.businessId = businessId;
    } else if (businessId === null) {
      // Filter for super admins (no businessId)
      where.businessId = null;
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[GET /api/admin/users]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, ...data } = updateUserSchema.parse(body);

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Don't allow changing own role
    if (userId === session.userId && data.role && data.role !== session.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const user = await db.user.update({
      where: { id: userId },
      data,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[PATCH /api/admin/users]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

