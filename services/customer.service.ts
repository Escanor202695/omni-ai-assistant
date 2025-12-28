import { db } from '@/lib/db';
import { Customer, Prisma } from '@prisma/client';

export interface ListCustomersParams {
  page: number;
  limit: number;
  search?: string;
  tags?: string[];
}

export interface CreateCustomerData {
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  notes?: string;
}

export class CustomerService {
  static async list(businessId: string, params: ListCustomersParams) {
    const { page, limit, search, tags } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      businessId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } },
        ],
      }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    };

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastContactAt: 'desc' },
      }),
      db.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(businessId: string, id: string) {
    const customer = await db.customer.findFirst({
      where: { id, businessId },
      include: {
        conversations: { take: 10, orderBy: { updatedAt: 'desc' } },
        appointments: { take: 10, orderBy: { startTime: 'desc' } },
      },
    });

    if (!customer) throw new Error('Customer not found');
    return customer;
  }

  static async create(businessId: string, data: CreateCustomerData) {
    return db.customer.create({
      data: { ...data, businessId },
    });
  }

  static async update(businessId: string, id: string, data: Partial<CreateCustomerData>) {
    return db.customer.update({
      where: { id, businessId } as any,
      data,
    });
  }

  static async delete(businessId: string, id: string) {
    return db.customer.delete({
      where: { id, businessId } as any,
    });
  }

  static async findOrCreate(businessId: string, identifier: { phone?: string; email?: string; name?: string }) {
    let customer = await db.customer.findFirst({
      where: {
        businessId,
        OR: [
          identifier.phone ? { phone: identifier.phone } : {},
          identifier.email ? { email: identifier.email } : {},
        ].filter(o => Object.keys(o).length > 0),
      },
    });

    if (!customer) {
      customer = await db.customer.create({
        data: { businessId, ...identifier },
      });
    }

    return customer;
  }

  static async incrementVisitCount(customerId: string) {
    return db.customer.update({
      where: { id: customerId },
      data: {
        visitCount: { increment: 1 },
        lastContactAt: new Date(),
      },
    });
  }
}
