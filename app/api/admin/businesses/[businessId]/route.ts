import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { UserRole } from '@prisma/client';
import { db } from '@/lib/db';
import { z } from 'zod';

const updateBusinessSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  industry: z.enum(['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER']).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  subscriptionTier: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  subscriptionStatus: z.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED']).optional(),
  messagesLimit: z.number().int().positive().optional(),
  voiceMinutesLimit: z.number().positive().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.business.findUnique({
      where: { id: params.businessId },
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            conversations: true,
            integrations: true,
            appointments: true,
            services: true,
            knowledgeDocs: true,
          },
        },
        users: {
          take: 10,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error('[GET /api/admin/businesses/:id]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = updateBusinessSchema.parse(body);

    // If slug is being updated, check for conflicts
    if (data.slug) {
      const existing = await db.business.findFirst({
        where: {
          slug: data.slug,
          NOT: { id: params.businessId },
        },
      });

      if (existing) {
        return NextResponse.json({ error: 'Business with this slug already exists' }, { status: 400 });
      }
    }

    const business = await db.business.update({
      where: { id: params.businessId },
      data,
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

    return NextResponse.json(business);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('[PATCH /api/admin/businesses/:id]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session || session.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.business.delete({
      where: { id: params.businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/businesses/:id]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


