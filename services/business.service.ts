import { db } from '@/lib/db';
import { Industry, Prisma } from '@prisma/client';
import { slugify } from '@/lib/utils';

export interface CreateBusinessData {
  name: string;
  industry: Industry;
  email: string;
  phone?: string;
}

export interface UpdateBusinessData {
  name?: string;
  industry?: Industry;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  timezone?: string;
  businessHours?: any;
  aiPersonality?: string;
  aiGreeting?: string;
  aiInstructions?: string;
}

export class BusinessService {
  static async create(data: CreateBusinessData) {
    let slug = slugify(data.name);
    
    // Ensure unique slug
    let counter = 1;
    while (await db.business.findUnique({ where: { slug } })) {
      slug = `${slugify(data.name)}-${counter}`;
      counter++;
    }

    return db.business.create({
      data: {
        ...data,
        slug,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
    });
  }

  static async getById(id: string) {
    return db.business.findUnique({
      where: { id },
      include: {
        users: true,
        _count: {
          select: {
            customers: true,
            conversations: true,
            appointments: true,
            services: true,
            knowledgeDocs: true,
          },
        },
      },
    });
  }

  static async update(id: string, data: UpdateBusinessData) {
    return db.business.update({
      where: { id },
      data,
    });
  }

  static async incrementUsage(businessId: string, type: 'interactions' | 'voice') {
    const field = type === 'interactions' ? 'monthlyInteractions' : 'monthlyVoiceMinutes';
    
    return db.business.update({
      where: { id: businessId },
      data: {
        [field]: { increment: 1 },
      },
    });
  }

  static async resetMonthlyUsage(businessId: string) {
    return db.business.update({
      where: { id: businessId },
      data: {
        monthlyInteractions: 0,
        monthlyVoiceMinutes: 0,
        usageResetAt: new Date(),
      },
    });
  }

  static async updateOnboarding(businessId: string, step: number, completed: boolean = false) {
    return db.business.update({
      where: { id: businessId },
      data: {
        onboardingStep: step,
        onboardingCompleted: completed,
      },
    });
  }
}
