import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(2),
  industry: z.enum(['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER']),
});

// Customer schemas
export const createCustomerSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const listCustomersSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
  search: z.string().optional(),
  tags: z.string().optional(),
});

// Conversation schemas
export const createConversationSchema = z.object({
  customerId: z.string(),
  channel: z.enum(['WEBCHAT', 'VOICE', 'WHATSAPP', 'SMS', 'EMAIL']),
});

// Appointment schemas
export const createAppointmentSchema = z.object({
  customerId: z.string(),
  serviceId: z.string().optional(),
  serviceName: z.string(),
  startTime: z.string().datetime(),
  duration: z.number().min(15),
  notes: z.string().optional(),
});

export const checkAvailabilitySchema = z.object({
  date: z.string(),
  serviceId: z.string().optional(),
});

// Knowledge doc schemas
export const createKnowledgeDocSchema = z.object({
  title: z.string(),
  content: z.string(),
  docType: z.enum(['FAQ', 'SERVICE', 'POLICY', 'WEBSITE', 'DOCUMENT']),
  sourceUrl: z.string().url().optional(),
});

// Service schemas
export const createServiceSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().min(15),
  price: z.number().optional(),
  isBookable: z.boolean().default(true),
});

// Business update schema
export const updateBusinessSchema = z.object({
  name: z.string().optional(),
  industry: z.enum(['MEDSPA', 'SALON', 'DENTAL', 'FITNESS', 'HEALTHCARE', 'HOME_SERVICES', 'OTHER']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  website: z.string().url().optional(),
  timezone: z.string().optional(),
  aiPersonality: z.string().optional(),
  aiGreeting: z.string().optional(),
  aiInstructions: z.string().optional(),
});
