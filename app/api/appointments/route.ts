import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { AppointmentService } from '@/services/appointment.service';
import { createAppointmentSchema } from '@/lib/validations';
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
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      status: searchParams.get('status')?.split(',').filter(s => s) as any,
    };

    const result = await AppointmentService.list(session.businessId, params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/appointments]', error);
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
    console.log('[POST /api/appointments] Request body:', body);

    const data = createAppointmentSchema.parse(body);
    console.log('[POST /api/appointments] Validated data:', data);

    const appointment = await AppointmentService.create(session.businessId, {
      ...data,
      startTime: new Date(data.startTime),
    });

    console.log('[POST /api/appointments] Created appointment:', appointment);
    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/appointments] Error:', error);
    if (error.name === 'ZodError') {
      console.error('[POST /api/appointments] Validation errors:', error.errors);
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('[POST /api/appointments]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    await AppointmentService.delete(session.businessId, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/appointments]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
