import { db } from '@/lib/db';
import { BusinessService } from './business.service';
import { Industry } from '@prisma/client';

export interface RegisterData {
  email: string;
  password: string;
  businessName: string;
  industry: Industry;
}

export class AuthService {
  static async createUserWithBusiness(supabaseUserId: string, data: RegisterData) {
    // 1. Create business
    const business = await BusinessService.create({
      name: data.businessName,
      industry: data.industry,
      email: data.email,
    });

    // 2. Create user linked to business
    const user = await db.user.create({
      data: {
        supabaseUserId,
        email: data.email,
        businessId: business.id,
        role: 'owner',
      },
    });

    return { user, business };
  }

  static async getUserBySupabaseId(supabaseUserId: string) {
    return db.user.findUnique({
      where: { supabaseUserId },
      include: { business: true },
    });
  }

  static async getUserByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      include: { business: true },
    });
  }
}
