export const APP_NAME = 'Omni AI Assistant';
export const APP_DESCRIPTION = 'AI-powered customer engagement platform';

export const SUBSCRIPTION_LIMITS = {
  FREE: {
    monthlyInteractions: 100,
    monthlyVoiceMinutes: 0,
    maxKnowledgeDocs: 5,
    maxServices: 5,
  },
  STARTER: {
    monthlyInteractions: 1000,
    monthlyVoiceMinutes: 60,
    maxKnowledgeDocs: 50,
    maxServices: 20,
  },
  PROFESSIONAL: {
    monthlyInteractions: 10000,
    monthlyVoiceMinutes: 500,
    maxKnowledgeDocs: 500,
    maxServices: 100,
  },
} as const;

export const INDUSTRY_LABELS = {
  MEDSPA: 'Med Spa',
  SALON: 'Salon & Beauty',
  DENTAL: 'Dental',
  FITNESS: 'Fitness & Wellness',
  HEALTHCARE: 'Healthcare',
  HOME_SERVICES: 'Home Services',
  OTHER: 'Other',
} as const;

export const CHANNEL_LABELS = {
  WEBCHAT: 'Web Chat',
  VOICE: 'Voice Call',
  WHATSAPP: 'WhatsApp',
  SMS: 'SMS',
  EMAIL: 'Email',
} as const;

export const STATUS_COLORS = {
  ACTIVE: 'green',
  RESOLVED: 'gray',
  ESCALATED: 'red',
  ABANDONED: 'orange',
} as const;
