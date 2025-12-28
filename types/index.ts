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
