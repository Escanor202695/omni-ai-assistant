// Export all types
export * from '@prisma/client';

// API Response types
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: any;
}

// AI types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  content: string;
  tokenCount?: number;
  latencyMs?: number;
  model?: string;
  toolCalls?: ToolCall[];
  toolResults?: any[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// Session types
export interface Session {
  userId: string;
  businessId: string;
  email: string;
  role: string;
}

// ============== META WEBHOOK TYPES ==============

export interface MetaWebhookPayload {
  object: 'whatsapp_business_account' | 'instagram' | 'page';
  entry: Array<{
    id: string;
    time: number;
    changes?: Array<{
      value: {
        messaging_product?: string;
        metadata?: {
          display_phone_number: string;
          phone_number_id: string;
        };
        messages?: Array<MetaMessage>;
        statuses?: Array<MetaMessageStatus>;
      };
      field: string;
    }>;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: {
        mid: string;
        text: string;
      };
    }>;
  }>;
}

export interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'audio' | 'document' | 'interactive';
  text?: { body: string };
}

export interface MetaMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
