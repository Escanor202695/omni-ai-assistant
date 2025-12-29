import { db } from '@/lib/db';
import { AppointmentStatus } from '@prisma/client';
import { addMinutes, startOfDay, endOfDay } from 'date-fns';

export interface CreateAppointmentData {
  customerId: string;
  serviceId?: string;
  serviceName: string;
  startTime: Date;
  duration: number;
  notes?: string;
  conversationId?: string;
}

export class AppointmentService {
  static async list(businessId: string, params: {
    startDate?: Date;
    endDate?: Date;
    status?: AppointmentStatus[];
    page: number;
    limit: number;
  }) {
    const { startDate, endDate, status, page, limit } = params;
    const skip = (page - 1) * limit;

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where: {
          businessId,
          ...(startDate && endDate && {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
          ...(status?.length && { status: { in: status } }),
        },
        include: {
          customer: true,
          service: true,
        },
        skip,
        take: limit,
        orderBy: { startTime: 'asc' },
      }),
      db.appointment.count({
        where: {
          businessId,
          ...(startDate && endDate && {
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          }),
          ...(status?.length && { status: { in: status } }),
        },
      }),
    ]);

    return { data: appointments, meta: { page, limit, total } };
  }

  static async getById(businessId: string, id: string) {
    return db.appointment.findFirst({
      where: { id, businessId },
      include: {
        customer: true,
        service: true,
        conversation: true,
      },
    });
  }

  static async create(businessId: string, data: CreateAppointmentData) {
    const business = await db.business.findUnique({
      where: { id: businessId },
      select: { timezone: true },
    });

    const endTime = addMinutes(data.startTime, data.duration);

    return db.appointment.create({
      data: {
        businessId,
        customerId: data.customerId,
        serviceId: data.serviceId,
        serviceName: data.serviceName,
        startTime: data.startTime,
        endTime,
        duration: data.duration,
        timezone: business?.timezone || 'America/New_York',
        notes: data.notes,
        conversationId: data.conversationId,
      },
    });
  }

  static async update(businessId: string, id: string, data: Partial<CreateAppointmentData>) {
    return db.appointment.update({
      where: { id, businessId } as any,
      data: {
        ...(data.serviceName && { serviceName: data.serviceName }),
        ...(data.startTime && { 
          startTime: data.startTime,
          endTime: addMinutes(data.startTime, data.duration || 60),
        }),
        ...(data.notes && { notes: data.notes }),
      },
    });
  }

  static async updateStatus(businessId: string, id: string, status: AppointmentStatus) {
    return db.appointment.update({
      where: { id, businessId } as any,
      data: { status },
    });
  }

  static async cancel(businessId: string, id: string) {
    return this.updateStatus(businessId, id, 'CANCELED');
  }

  static async getAvailability(businessId: string, date: Date, serviceId?: string) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get all appointments for the day
    const appointments = await db.appointment.findMany({
      where: {
        businessId,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate available slots (simplified - would integrate with business hours)
    const slots = [];
    const businessHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    
    for (let hour = businessHours.start; hour < businessHours.end; hour++) {
      for (let minute of [0, 30]) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if slot is already booked
        const isBooked = appointments.some(apt => 
          slotTime >= apt.startTime && slotTime < apt.endTime
        );
        
        if (!isBooked) {
          slots.push(slotTime.toISOString());
        }
      }
    }

    return slots;
  }

  static async delete(businessId: string, id: string) {
    return db.appointment.delete({
      where: { id, businessId } as any,
    });
  }
}
