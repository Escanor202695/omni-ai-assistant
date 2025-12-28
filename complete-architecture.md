# MULTI-TENANT AI SAAS — TECHNICAL SPECIFICATION

## PROJECT OVERVIEW

Multi-tenant AI assistant SaaS where:
- You own all infrastructure (Meta app, Vapi, SendGrid)
- Customers connect their business channels via OAuth
- One central AI agent handles all conversations with tenant isolation
- Every database query filters by `businessId`

---

## TECH STACK

```
Framework: Next.js 14 (App Router)
Database: PostgreSQL (Supabase)
ORM: Prisma
Auth: NextAuth.js (or Clerk)
Vector DB: Pinecone (namespaced by businessId)
LLM: OpenRouter (Claude/GPT-4)
File Storage: Supabase Storage
Payments: Stripe
Deployment: Vercel
```

---

## FOLDER STRUCTURE

```
/app
  /api
    /auth
      /[...nextauth]/route.ts      # Auth endpoints
    /webhooks
      /meta/route.ts               # WhatsApp + Instagram + Facebook webhooks
      /vapi/route.ts               # Vapi call webhooks
    /chat
      /public/route.ts             # Public chat widget API
    /integrations
      /meta
        /connect/route.ts          # Start OAuth flow
        /callback/route.ts         # OAuth callback
      /google
        /connect/route.ts          # Google Calendar OAuth
        /callback/route.ts         # Google Calendar callback
      /vapi
        /tools/route.ts            # Tools Vapi assistant calls
    /businesses
      /route.ts                    # CRUD businesses (super admin)
      /[businessId]/route.ts       # Single business operations
    /customers
      /route.ts                    # List customers (scoped by business)
      /[customerId]/route.ts       # Single customer
    /conversations
      /route.ts                    # List conversations
      /[conversationId]/route.ts   # Single conversation + messages
    /knowledge
      /upload/route.ts             # Upload docs to knowledge base
      /search/route.ts             # RAG search
    /appointments
      /route.ts                    # CRUD appointments
      /available-slots/route.ts    # Check availability
    /admin
      /businesses/route.ts         # Super admin: all businesses
      /stats/route.ts              # System-wide analytics
  /(dashboard)
    /layout.tsx                    # Dashboard layout with sidebar
    /page.tsx                      # Dashboard home
    /conversations/page.tsx        # Conversation list
    /conversations/[id]/page.tsx   # Single conversation view
    /customers/page.tsx            # Customer list
    /customers/[id]/page.tsx       # Customer profile
    /appointments/page.tsx         # Appointments calendar
    /knowledge/page.tsx            # Knowledge base management
    /settings/page.tsx             # Business settings
    /integrations/page.tsx         # Connect channels
  /(admin)
    /admin/layout.tsx              # Super admin layout
    /admin/page.tsx                # Admin dashboard
    /admin/businesses/page.tsx     # Manage all businesses
    /admin/businesses/[id]/page.tsx
  /(public)
    /widget/[slug]/page.tsx        # Chat widget iframe source

/lib
  /db.ts                           # Prisma client singleton
  /auth.ts                         # Auth config + helpers
  /encryption.ts                   # Token encryption/decryption
  /ai
    /agent.ts                      # Central AI agent
    /tools.ts                      # Tool definitions
    /prompts.ts                    # System prompts per business
  /integrations
    /meta.ts                       # Meta API helpers (send message, etc.)
    /vapi.ts                       # Vapi API helpers
    /google-calendar.ts            # Google Calendar API
  /services
    /customer.service.ts           # Customer CRUD + identity resolution
    /conversation.service.ts       # Conversation management
    /message.service.ts            # Message handling
    /appointment.service.ts        # Booking logic
    /knowledge.service.ts          # RAG operations
  /utils
    /webhook-verify.ts             # Verify webhook signatures
    /rate-limit.ts                 # Per-business rate limiting
  /types
    /index.ts                      # All TypeScript types

/prisma
  /schema.prisma                   # Database schema
  /migrations/                     # Migration files
  /seed.ts                         # Seed data

/public
  /widget.js                       # Embeddable chat widget script

/middleware.ts                     # Auth + business scoping middleware
```

---

## DATABASE SCHEMA (PRISMA)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== ENUMS ==============

enum UserRole {
  SUPER_ADMIN
  BUSINESS_OWNER
  TEAM_MEMBER
}

enum IntegrationType {
  WHATSAPP
  INSTAGRAM
  FACEBOOK
  VAPI
  GOOGLE_CALENDAR
  EMAIL
}

enum Channel {
  WHATSAPP
  INSTAGRAM
  FACEBOOK
  VOICE
  WEBCHAT
  EMAIL
}

enum ConversationStatus {
  ACTIVE
  CLOSED
  HANDED_OFF
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
}

// ============== MODELS ==============

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String?   // Hashed, nullable if using OAuth
  role          UserRole  @default(BUSINESS_OWNER)
  businessId    String?   // Null for SUPER_ADMIN
  business      Business? @relation(fields: [businessId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([businessId])
  @@index([email])
}

model Business {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique  // For widget URL: widget.yourapp.com/[slug]
  email           String?
  phone           String?
  website         String?
  timezone        String    @default("America/New_York")
  
  // AI Configuration
  aiSettings      Json      @default("{}")
  // {
  //   "personality": "friendly and professional",
  //   "businessType": "med_spa",
  //   "greeting": "Hi! Welcome to...",
  //   "fallbackMessage": "Let me connect you with our team.",
  //   "appointmentBuffer": 30,  // minutes between appointments
  //   "maxAdvanceBooking": 30   // days ahead
  // }
  
  businessHours   Json      @default("[]")
  // [
  //   { "day": 0, "open": "09:00", "close": "17:00", "enabled": true },
  //   { "day": 1, "open": "09:00", "close": "17:00", "enabled": true },
  //   ...
  // ]

  // Billing
  stripeCustomerId    String?
  subscriptionId      String?
  subscriptionStatus  String?
  plan                String    @default("starter")
  
  // Usage tracking
  messagesThisMonth   Int       @default(0)
  messagesLimit       Int       @default(1000)
  voiceMinutesUsed    Float     @default(0)
  voiceMinutesLimit   Float     @default(100)
  
  // Relations
  users           User[]
  integrations    Integration[]
  customers       Customer[]
  conversations   Conversation[]
  appointments    Appointment[]
  knowledgeItems  KnowledgeItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([slug])
}

model Integration {
  id            String          @id @default(cuid())
  businessId    String
  business      Business        @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  type          IntegrationType
  isActive      Boolean         @default(true)
  
  // Encrypted OAuth tokens
  accessToken   String          // Encrypted
  refreshToken  String?         // Encrypted
  tokenExpiry   DateTime?
  
  // Platform identifiers
  platformId    String          // WhatsApp phone_number_id, Instagram page_id, etc.
  platformName  String?         // Display name: "Main WhatsApp", "Business Instagram"
  
  // Platform-specific metadata
  metadata      Json            @default("{}")
  // WhatsApp: { "phoneNumber": "+1234567890", "wabaId": "..." }
  // Instagram: { "username": "...", "pageId": "..." }
  // Vapi: { "assistantId": "...", "phoneNumber": "+1..." }
  // Google Calendar: { "calendarId": "primary", "email": "..." }
  
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@unique([businessId, type, platformId])
  @@index([businessId])
  @@index([platformId])
  @@index([type, platformId])  // For webhook routing
}

model Customer {
  id            String    @id @default(cuid())
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  // Basic info
  name          String?
  email         String?
  phone         String?
  
  // Channel identifiers (for cross-channel identity)
  whatsappId    String?   // WhatsApp phone number
  instagramId   String?   // Instagram scoped user ID
  facebookId    String?   // Facebook page-scoped user ID
  
  // Customer data
  notes         String?
  tags          String[]  @default([])
  metadata      Json      @default("{}")
  
  // Relations
  conversations Conversation[]
  appointments  Appointment[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([businessId])
  @@index([businessId, phone])
  @@index([businessId, email])
  @@index([businessId, whatsappId])
  @@index([businessId, instagramId])
}

model Conversation {
  id            String              @id @default(cuid())
  businessId    String
  business      Business            @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customerId    String
  customer      Customer            @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  channel       Channel
  status        ConversationStatus  @default(ACTIVE)
  
  // Platform conversation ID (for threading)
  platformConversationId  String?
  
  // Summary for quick reference
  summary       String?
  lastMessageAt DateTime?
  
  // Relations
  messages      Message[]
  
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt

  @@index([businessId])
  @@index([businessId, customerId])
  @@index([businessId, status])
  @@index([businessId, channel])
}

model Message {
  id              String        @id @default(cuid())
  conversationId  String
  conversation    Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  role            MessageRole
  content         String
  channel         Channel
  
  // Platform message ID (for replies, reactions)
  platformMessageId String?
  
  // Tool calls and results
  toolCalls       Json?         // [{ "name": "book_appointment", "args": {...}, "result": {...} }]
  
  // Metadata
  metadata        Json          @default("{}")
  // { "tokens": 150, "model": "claude-3-sonnet", "latency": 1200 }
  
  createdAt       DateTime      @default(now())

  @@index([conversationId])
  @@index([conversationId, createdAt])
}

model Appointment {
  id            String            @id @default(cuid())
  businessId    String
  business      Business          @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customerId    String
  customer      Customer          @relation(fields: [customerId], references: [id], onDelete: Cascade)
  
  title         String
  description   String?
  
  startTime     DateTime
  endTime       DateTime
  timezone      String
  
  status        AppointmentStatus @default(SCHEDULED)
  
  // External calendar event
  googleEventId String?
  
  // Booking metadata
  bookedVia     Channel           // Which channel was used to book
  metadata      Json              @default("{}")
  
  // Reminders sent
  reminder24hSent   Boolean       @default(false)
  reminder1hSent    Boolean        @default(false)
  
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@index([businessId])
  @@index([businessId, startTime])
  @@index([businessId, customerId])
  @@index([businessId, status])
}

model KnowledgeItem {
  id            String    @id @default(cuid())
  businessId    String
  business      Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  title         String
  content       String    // Raw text content
  sourceType    String    // "file", "url", "manual"
  sourceUrl     String?
  fileName      String?
  
  // Pinecone reference
  pineconeIds   String[]  @default([])  // Vector IDs in Pinecone
  
  // Status
  isProcessed   Boolean   @default(false)
  chunkCount    Int       @default(0)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([businessId])
}

model WebhookLog {
  id            String    @id @default(cuid())
  source        String    // "meta", "vapi", "stripe"
  event         String    // "message", "call_ended", "payment_success"
  payload       Json
  processed     Boolean   @default(false)
  error         String?
  
  createdAt     DateTime  @default(now())

  @@index([source, createdAt])
  @@index([processed])
}
```

---

## CORE TYPES

```typescript
// lib/types/index.ts

// ============== INTEGRATION TYPES ==============

export interface MetaWebhookPayload {
  object: "whatsapp_business_account" | "instagram" | "page";
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
    messaging?: Array<{  // Instagram/Facebook format
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
  type: "text" | "image" | "audio" | "document" | "interactive";
  text?: { body: string };
}

export interface MetaMessageStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id: string;
}

export interface VapiWebhookPayload {
  message: {
    type: "function-call" | "end-of-call-report" | "transcript" | "hang" | "speech-update";
    call?: VapiCall;
    functionCall?: {
      name: string;
      parameters: Record<string, unknown>;
    };
    endOfCallReport?: {
      summary: string;
      transcript: string;
      recordingUrl?: string;
      durationSeconds: number;
    };
  };
}

export interface VapiCall {
  id: string;
  assistantId: string;
  phoneNumber: {
    number: string;
  };
  customer?: {
    number: string;
  };
  status: string;
}

// ============== NORMALIZED MESSAGE ==============

export interface NormalizedMessage {
  businessId: string;
  customerId: string;
  conversationId: string;
  channel: Channel;
  content: string;
  platformMessageId: string;
  platformSenderId: string;
  metadata: Record<string, unknown>;
}

// ============== AI AGENT TYPES ==============

export interface AgentContext {
  business: BusinessWithSettings;
  customer: CustomerWithHistory;
  conversation: ConversationWithMessages;
  knowledgeResults: KnowledgeChunk[];
}

export interface BusinessWithSettings {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  aiSettings: AISettings;
  businessHours: BusinessHour[];
}

export interface AISettings {
  personality: string;
  businessType: string;
  greeting: string;
  fallbackMessage: string;
  appointmentBuffer: number;
  maxAdvanceBooking: number;
  services?: Service[];
}

export interface Service {
  id: string;
  name: string;
  duration: number;  // minutes
  price: number;
  description?: string;
}

export interface BusinessHour {
  day: number;  // 0 = Sunday
  open: string; // "09:00"
  close: string; // "17:00"
  enabled: boolean;
}

export interface CustomerWithHistory {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  recentMessages: MessageSummary[];
  appointments: AppointmentSummary[];
  tags: string[];
}

export interface MessageSummary {
  role: "user" | "assistant";
  content: string;
  channel: Channel;
  createdAt: Date;
}

export interface AppointmentSummary {
  title: string;
  startTime: Date;
  status: string;
}

export interface KnowledgeChunk {
  content: string;
  score: number;
  metadata: {
    title: string;
    sourceType: string;
  };
}

// ============== TOOL DEFINITIONS ==============

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export type ToolName = 
  | "check_availability"
  | "book_appointment"
  | "cancel_appointment"
  | "get_services"
  | "get_pricing"
  | "send_to_human"
  | "get_customer_info"
  | "update_customer_info";

export interface ToolCall {
  name: ToolName;
  args: Record<string, unknown>;
}

// ============== API RESPONSE TYPES ==============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Channel = "WHATSAPP" | "INSTAGRAM" | "FACEBOOK" | "VOICE" | "WEBCHAT" | "EMAIL";
```

---

## CORE SERVICES

### 1. Encryption Service

```typescript
// lib/encryption.ts

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

### 2. Customer Service

```typescript
// lib/services/customer.service.ts

import { prisma } from "@/lib/db";
import { Channel } from "@/lib/types";

interface FindOrCreateParams {
  businessId: string;
  channel: Channel;
  platformSenderId: string;
  name?: string;
  phone?: string;
  email?: string;
}

export async function findOrCreateCustomer(params: FindOrCreateParams) {
  const { businessId, channel, platformSenderId, name, phone, email } = params;

  // Build where clause based on channel
  const channelIdField = getChannelIdField(channel);
  
  // Try to find by channel ID first
  let customer = await prisma.customer.findFirst({
    where: {
      businessId,
      [channelIdField]: platformSenderId,
    },
  });

  // If not found by channel ID, try phone number (for cross-channel linking)
  if (!customer && phone) {
    customer = await prisma.customer.findFirst({
      where: {
        businessId,
        phone,
      },
    });

    // If found by phone, update with new channel ID
    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { [channelIdField]: platformSenderId },
      });
    }
  }

  // Create new customer if not found
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        businessId,
        [channelIdField]: platformSenderId,
        phone: phone || (channel === "WHATSAPP" ? platformSenderId : undefined),
        name,
        email,
      },
    });
  }

  return customer;
}

export async function getCustomerWithHistory(customerId: string, businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      conversations: {
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 50,
          },
        },
        orderBy: { lastMessageAt: "desc" },
        take: 10,
      },
      appointments: {
        where: {
          startTime: { gte: new Date() },
        },
        orderBy: { startTime: "asc" },
        take: 5,
      },
    },
  });

  if (!customer) return null;

  // Flatten messages from all conversations
  const recentMessages = customer.conversations
    .flatMap((c) => c.messages)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 30)
    .map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
      channel: m.channel,
      createdAt: m.createdAt,
    }));

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    tags: customer.tags,
    recentMessages,
    appointments: customer.appointments.map((a) => ({
      title: a.title,
      startTime: a.startTime,
      status: a.status,
    })),
  };
}

function getChannelIdField(channel: Channel): string {
  const mapping: Record<Channel, string> = {
    WHATSAPP: "whatsappId",
    INSTAGRAM: "instagramId",
    FACEBOOK: "facebookId",
    VOICE: "phone",
    WEBCHAT: "id",  // Use main ID for webchat
    EMAIL: "email",
  };
  return mapping[channel];
}
```

### 3. Conversation Service

```typescript
// lib/services/conversation.service.ts

import { prisma } from "@/lib/db";
import { Channel } from "@/lib/types";

interface GetOrCreateParams {
  businessId: string;
  customerId: string;
  channel: Channel;
  platformConversationId?: string;
}

export async function getOrCreateConversation(params: GetOrCreateParams) {
  const { businessId, customerId, channel, platformConversationId } = params;

  // Find active conversation for this customer + channel
  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId,
      customerId,
      channel,
      status: "ACTIVE",
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  // Create new conversation if none exists
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        businessId,
        customerId,
        channel,
        platformConversationId,
        status: "ACTIVE",
      },
      include: {
        messages: true,
      },
    });
  }

  return conversation;
}

export async function addMessage(params: {
  conversationId: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  channel: Channel;
  platformMessageId?: string;
  toolCalls?: unknown[];
  metadata?: Record<string, unknown>;
}) {
  const message = await prisma.message.create({
    data: {
      conversationId: params.conversationId,
      role: params.role,
      content: params.content,
      channel: params.channel,
      platformMessageId: params.platformMessageId,
      toolCalls: params.toolCalls ? JSON.stringify(params.toolCalls) : undefined,
      metadata: params.metadata || {},
    },
  });

  // Update conversation lastMessageAt
  await prisma.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date() },
  });

  return message;
}
```

### 4. Knowledge Service

```typescript
// lib/services/knowledge.service.ts

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const INDEX_NAME = process.env.PINECONE_INDEX_NAME!;

export async function searchKnowledge(
  businessId: string,
  query: string,
  topK: number = 5
) {
  // Generate embedding for query
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search Pinecone with business namespace
  const index = pinecone.Index(INDEX_NAME);
  const results = await index.namespace(businessId).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return results.matches.map((match) => ({
    content: match.metadata?.content as string,
    score: match.score || 0,
    metadata: {
      title: match.metadata?.title as string,
      sourceType: match.metadata?.sourceType as string,
    },
  }));
}

export async function indexDocument(
  businessId: string,
  documentId: string,
  title: string,
  content: string,
  sourceType: string
) {
  // Split content into chunks (simple approach - use better chunking in production)
  const chunks = splitIntoChunks(content, 500);

  // Generate embeddings for all chunks
  const embeddings = await Promise.all(
    chunks.map(async (chunk, i) => {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      return {
        id: `${documentId}-${i}`,
        values: response.data[0].embedding,
        metadata: {
          content: chunk,
          title,
          sourceType,
          documentId,
          chunkIndex: i,
        },
      };
    })
  );

  // Upsert to Pinecone with business namespace
  const index = pinecone.Index(INDEX_NAME);
  await index.namespace(businessId).upsert(embeddings);

  return embeddings.map((e) => e.id);
}

function splitIntoChunks(text: string, maxTokens: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > maxTokens * 4) { // Rough token estimate
      chunks.push(currentChunk.join(" "));
      currentChunk = [word];
      currentLength = word.length;
    } else {
      currentChunk.push(word);
      currentLength += word.length + 1;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}
```

---

## CENTRAL AI AGENT

```typescript
// lib/ai/agent.ts

import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { AgentContext, ToolCall, ToolResult, Channel } from "@/lib/types";
import { tools, executeTool } from "./tools";
import { buildSystemPrompt } from "./prompts";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

interface ProcessMessageParams {
  context: AgentContext;
  userMessage: string;
  channel: Channel;
}

interface AgentResponse {
  content: string;
  toolCalls: Array<ToolCall & { result: ToolResult }>;
}

export async function processMessage(params: ProcessMessageParams): Promise<AgentResponse> {
  const { context, userMessage, channel } = params;
  
  const systemPrompt = buildSystemPrompt(context, channel);
  
  // Build message history
  const messages = [
    ...context.customer.recentMessages.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const executedTools: Array<ToolCall & { result: ToolResult }> = [];

  // Call LLM with tools
  const response = await generateText({
    model: openrouter("anthropic/claude-sonnet-4"),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 5, // Allow multiple tool calls
    onStepFinish: async ({ toolCalls, toolResults }) => {
      if (toolCalls) {
        for (let i = 0; i < toolCalls.length; i++) {
          const call = toolCalls[i];
          const result = toolResults[i];
          executedTools.push({
            name: call.toolName as ToolCall["name"],
            args: call.args as Record<string, unknown>,
            result: result.result as ToolResult,
          });
        }
      }
    },
  });

  // Format response for channel
  const formattedContent = formatForChannel(response.text, channel);

  return {
    content: formattedContent,
    toolCalls: executedTools,
  };
}

function formatForChannel(content: string, channel: Channel): string {
  switch (channel) {
    case "VOICE":
      // Keep it short and conversational for voice
      return content.length > 300 
        ? content.substring(0, 297) + "..."
        : content;
    
    case "WHATSAPP":
    case "INSTAGRAM":
      // WhatsApp/Instagram can handle longer messages with emojis
      return content;
    
    case "EMAIL":
      // More formal, can be longer
      return content;
    
    default:
      return content;
  }
}
```

### Tool Definitions

```typescript
// lib/ai/tools.ts

import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ToolResult } from "@/lib/types";
import { createCalendarEvent } from "@/lib/integrations/google-calendar";

// Context passed to tool execution
let toolContext: {
  businessId: string;
  customerId: string;
  timezone: string;
} | null = null;

export function setToolContext(ctx: typeof toolContext) {
  toolContext = ctx;
}

export const tools = {
  check_availability: tool({
    description: "Check available appointment slots for a specific date or date range",
    parameters: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format"),
      serviceId: z.string().optional().describe("Service ID if checking for specific service"),
    }),
    execute: async ({ date, serviceId }): Promise<ToolResult> => {
      if (!toolContext) return { success: false, error: "No context" };

      const business = await prisma.business.findUnique({
        where: { id: toolContext.businessId },
      });

      if (!business) return { success: false, error: "Business not found" };

      // Get existing appointments for that day
      const startOfDay = new Date(`${date}T00:00:00`);
      const endOfDay = new Date(`${date}T23:59:59`);

      const existingAppointments = await prisma.appointment.findMany({
        where: {
          businessId: toolContext.businessId,
          startTime: { gte: startOfDay, lte: endOfDay },
          status: { notIn: ["CANCELLED"] },
        },
      });

      // Calculate available slots based on business hours
      const businessHours = business.businessHours as Array<{
        day: number;
        open: string;
        close: string;
        enabled: boolean;
      }>;

      const dayOfWeek = startOfDay.getDay();
      const todayHours = businessHours.find((h) => h.day === dayOfWeek);

      if (!todayHours || !todayHours.enabled) {
        return { success: true, data: { available: false, slots: [], reason: "Closed on this day" } };
      }

      // Generate 30-minute slots
      const slots = generateSlots(
        date,
        todayHours.open,
        todayHours.close,
        existingAppointments,
        30
      );

      return {
        success: true,
        data: { available: slots.length > 0, slots },
      };
    },
  }),

  book_appointment: tool({
    description: "Book an appointment for the customer",
    parameters: z.object({
      date: z.string().describe("Date in YYYY-MM-DD format"),
      time: z.string().describe("Time in HH:MM format (24-hour)"),
      serviceId: z.string().optional().describe("Service ID"),
      title: z.string().describe("Appointment title/service name"),
      duration: z.number().default(30).describe("Duration in minutes"),
    }),
    execute: async ({ date, time, title, duration, serviceId }): Promise<ToolResult> => {
      if (!toolContext) return { success: false, error: "No context" };

      const startTime = new Date(`${date}T${time}:00`);
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      // Check for conflicts
      const conflict = await prisma.appointment.findFirst({
        where: {
          businessId: toolContext.businessId,
          status: { notIn: ["CANCELLED"] },
          OR: [
            { startTime: { lt: endTime }, endTime: { gt: startTime } },
          ],
        },
      });

      if (conflict) {
        return { success: false, error: "Time slot not available" };
      }

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          businessId: toolContext.businessId,
          customerId: toolContext.customerId,
          title,
          startTime,
          endTime,
          timezone: toolContext.timezone,
          bookedVia: "WEBCHAT", // Will be overridden by actual channel
          status: "SCHEDULED",
        },
      });

      // Create Google Calendar event if integration exists
      const calendarIntegration = await prisma.integration.findFirst({
        where: {
          businessId: toolContext.businessId,
          type: "GOOGLE_CALENDAR",
          isActive: true,
        },
      });

      if (calendarIntegration) {
        try {
          const customer = await prisma.customer.findUnique({
            where: { id: toolContext.customerId },
          });

          const eventId = await createCalendarEvent({
            integration: calendarIntegration,
            title,
            startTime,
            endTime,
            attendeeEmail: customer?.email,
          });

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { googleEventId: eventId },
          });
        } catch (error) {
          console.error("Failed to create calendar event:", error);
        }
      }

      return {
        success: true,
        data: {
          appointmentId: appointment.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };
    },
  }),

  get_services: tool({
    description: "Get list of services offered by the business",
    parameters: z.object({}),
    execute: async (): Promise<ToolResult> => {
      if (!toolContext) return { success: false, error: "No context" };

      const business = await prisma.business.findUnique({
        where: { id: toolContext.businessId },
      });

      const aiSettings = business?.aiSettings as { services?: Array<{
        id: string;
        name: string;
        duration: number;
        price: number;
        description?: string;
      }> };

      return {
        success: true,
        data: { services: aiSettings?.services || [] },
      };
    },
  }),

  get_pricing: tool({
    description: "Get pricing information for services",
    parameters: z.object({
      serviceId: z.string().optional().describe("Specific service ID, or omit for all prices"),
    }),
    execute: async ({ serviceId }): Promise<ToolResult> => {
      if (!toolContext) return { success: false, error: "No context" };

      const business = await prisma.business.findUnique({
        where: { id: toolContext.businessId },
      });

      const aiSettings = business?.aiSettings as { services?: Array<{
        id: string;
        name: string;
        price: number;
      }> };

      const services = aiSettings?.services || [];

      if (serviceId) {
        const service = services.find((s) => s.id === serviceId);
        return { success: true, data: service || null };
      }

      return { success: true, data: { services } };
    },
  }),

  send_to_human: tool({
    description: "Escalate conversation to a human agent when AI cannot help",
    parameters: z.object({
      reason: z.string().describe("Why escalation is needed"),
    }),
    execute: async ({ reason }): Promise<ToolResult> => {
      // In MVP, just flag the conversation
      // Later: integrate with notification system
      return {
        success: true,
        data: {
          escalated: true,
          message: "A team member will follow up with you shortly.",
        },
      };
    },
  }),
};

function generateSlots(
  date: string,
  openTime: string,
  closeTime: string,
  existingAppointments: Array<{ startTime: Date; endTime: Date }>,
  slotDuration: number
): string[] {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let current = new Date(`${date}T${openTime}:00`);
  const end = new Date(`${date}T${closeTime}:00`);

  while (current < end) {
    const slotEnd = new Date(current.getTime() + slotDuration * 60 * 1000);

    // Check if slot conflicts with existing appointment
    const hasConflict = existingAppointments.some(
      (apt) => current < apt.endTime && slotEnd > apt.startTime
    );

    if (!hasConflict && slotEnd <= end) {
      slots.push(current.toTimeString().slice(0, 5));
    }

    current = slotEnd;
  }

  return slots;
}
```

### System Prompts

```typescript
// lib/ai/prompts.ts

import { AgentContext, Channel } from "@/lib/types";

export function buildSystemPrompt(context: AgentContext, channel: Channel): string {
  const { business, customer, knowledgeResults } = context;

  const channelInstructions = getChannelInstructions(channel);
  const knowledgeContext = formatKnowledgeContext(knowledgeResults);
  const customerContext = formatCustomerContext(customer);

  return `You are an AI assistant for ${business.name}.

## Your Personality
${business.aiSettings.personality || "Be friendly, professional, and helpful."}

## Business Information
- Business Type: ${business.aiSettings.businessType || "Service business"}
- Timezone: ${business.timezone}

## Available Services
${formatServices(business.aiSettings.services)}

## Customer Context
${customerContext}

## Knowledge Base (Use this to answer questions)
${knowledgeContext}

## Channel-Specific Instructions
${channelInstructions}

## Guidelines
1. Be conversational and natural
2. Use the customer's name if known
3. When booking appointments, always confirm the date, time, and service
4. If you don't know something, say so honestly
5. For complex issues, offer to connect them with a human
6. Never make up information not in your knowledge base

## Tools
You have access to tools for:
- Checking appointment availability
- Booking appointments
- Getting service/pricing information
- Escalating to human agents

Always confirm before booking an appointment.`;
}

function getChannelInstructions(channel: Channel): string {
  switch (channel) {
    case "VOICE":
      return `This is a voice conversation.
- Keep responses SHORT (under 100 words)
- Use natural, conversational language
- Avoid lists or formatted text
- Speak as if talking on the phone`;

    case "WHATSAPP":
    case "INSTAGRAM":
      return `This is a chat conversation.
- Use a friendly, conversational tone
- Emojis are OK but don't overdo it
- Can use short lists if helpful
- Keep responses concise but complete`;

    case "EMAIL":
      return `This is an email conversation.
- Use a professional tone
- Can be more detailed/formal
- Structure responses clearly
- Include greeting and sign-off`;

    default:
      return `Use a friendly, helpful tone. Keep responses clear and concise.`;
  }
}

function formatKnowledgeContext(results: AgentContext["knowledgeResults"]): string {
  if (!results.length) return "No specific knowledge available.";

  return results
    .map((r, i) => `[${i + 1}] ${r.metadata.title}:\n${r.content}`)
    .join("\n\n");
}

function formatCustomerContext(customer: AgentContext["customer"]): string {
  const parts: string[] = [];

  if (customer.name) parts.push(`Name: ${customer.name}`);
  if (customer.phone) parts.push(`Phone: ${customer.phone}`);
  if (customer.email) parts.push(`Email: ${customer.email}`);

  if (customer.appointments.length > 0) {
    const upcoming = customer.appointments[0];
    parts.push(`Upcoming appointment: ${upcoming.title} on ${upcoming.startTime.toLocaleDateString()}`);
  }

  if (customer.tags.length > 0) {
    parts.push(`Tags: ${customer.tags.join(", ")}`);
  }

  return parts.length > 0 ? parts.join("\n") : "New customer (no history)";
}

function formatServices(services?: Array<{ name: string; price: number; duration: number }>) {
  if (!services?.length) return "No services configured.";

  return services
    .map((s) => `- ${s.name}: $${s.price} (${s.duration} min)`)
    .join("\n");
}
```

---

## WEBHOOK HANDLERS

### Meta Webhook (WhatsApp + Instagram)

```typescript
// app/api/webhooks/meta/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { MetaWebhookPayload, Channel } from "@/lib/types";
import { findOrCreateCustomer } from "@/lib/services/customer.service";
import { getOrCreateConversation, addMessage } from "@/lib/services/conversation.service";
import { getCustomerWithHistory } from "@/lib/services/customer.service";
import { searchKnowledge } from "@/lib/services/knowledge.service";
import { processMessage, setToolContext } from "@/lib/ai/agent";
import { sendWhatsAppMessage, sendInstagramMessage } from "@/lib/integrations/meta";

// Webhook verification (GET)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// Webhook messages (POST)
export async function POST(req: NextRequest) {
  // Verify signature
  const signature = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  if (!verifySignature(body, signature)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const payload: MetaWebhookPayload = JSON.parse(body);

  // Log webhook for debugging
  await prisma.webhookLog.create({
    data: {
      source: "meta",
      event: payload.object,
      payload: payload as unknown as Record<string, unknown>,
    },
  });

  // Process asynchronously, return 200 immediately
  processWebhook(payload).catch(console.error);

  return new NextResponse("OK", { status: 200 });
}

async function processWebhook(payload: MetaWebhookPayload) {
  for (const entry of payload.entry) {
    // WhatsApp format
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          for (const message of change.value.messages) {
            await handleWhatsAppMessage(
              change.value.metadata!.phone_number_id,
              message.from,
              message.text?.body || "",
              message.id
            );
          }
        }
      }
    }

    // Instagram/Facebook format
    if (entry.messaging) {
      for (const event of entry.messaging) {
        if (event.message?.text) {
          await handleInstagramMessage(
            entry.id, // Page ID
            event.sender.id,
            event.message.text,
            event.message.mid
          );
        }
      }
    }
  }
}

async function handleWhatsAppMessage(
  phoneNumberId: string,
  from: string,
  text: string,
  messageId: string
) {
  // Find business by phone_number_id
  const integration = await prisma.integration.findFirst({
    where: {
      type: "WHATSAPP",
      platformId: phoneNumberId,
      isActive: true,
    },
    include: { business: true },
  });

  if (!integration) {
    console.error(`No integration found for phone_number_id: ${phoneNumberId}`);
    return;
  }

  await handleMessage({
    businessId: integration.businessId,
    business: integration.business,
    integration,
    channel: "WHATSAPP",
    platformSenderId: from,
    text,
    platformMessageId: messageId,
    sendResponse: async (response: string) => {
      await sendWhatsAppMessage({
        accessToken: decrypt(integration.accessToken),
        phoneNumberId,
        to: from,
        text: response,
      });
    },
  });
}

async function handleInstagramMessage(
  pageId: string,
  senderId: string,
  text: string,
  messageId: string
) {
  const integration = await prisma.integration.findFirst({
    where: {
      type: "INSTAGRAM",
      platformId: pageId,
      isActive: true,
    },
    include: { business: true },
  });

  if (!integration) {
    console.error(`No integration found for page_id: ${pageId}`);
    return;
  }

  await handleMessage({
    businessId: integration.businessId,
    business: integration.business,
    integration,
    channel: "INSTAGRAM",
    platformSenderId: senderId,
    text,
    platformMessageId: messageId,
    sendResponse: async (response: string) => {
      await sendInstagramMessage({
        accessToken: decrypt(integration.accessToken),
        recipientId: senderId,
        text: response,
      });
    },
  });
}

async function handleMessage(params: {
  businessId: string;
  business: { timezone: string; aiSettings: unknown };
  integration: { id: string };
  channel: Channel;
  platformSenderId: string;
  text: string;
  platformMessageId: string;
  sendResponse: (response: string) => Promise<void>;
}) {
  const {
    businessId,
    business,
    channel,
    platformSenderId,
    text,
    platformMessageId,
    sendResponse,
  } = params;

  // 1. Find or create customer
  const customer = await findOrCreateCustomer({
    businessId,
    channel,
    platformSenderId,
    phone: channel === "WHATSAPP" ? platformSenderId : undefined,
  });

  // 2. Get or create conversation
  const conversation = await getOrCreateConversation({
    businessId,
    customerId: customer.id,
    channel,
  });

  // 3. Save incoming message
  await addMessage({
    conversationId: conversation.id,
    role: "USER",
    content: text,
    channel,
    platformMessageId,
  });

  // 4. Load context
  const customerWithHistory = await getCustomerWithHistory(customer.id, businessId);
  const knowledgeResults = await searchKnowledge(businessId, text, 5);

  // 5. Set tool context
  setToolContext({
    businessId,
    customerId: customer.id,
    timezone: business.timezone,
  });

  // 6. Process with AI
  const agentResponse = await processMessage({
    context: {
      business: {
        id: businessId,
        name: "", // Load from business
        slug: "",
        timezone: business.timezone,
        aiSettings: business.aiSettings as any,
        businessHours: [],
      },
      customer: customerWithHistory!,
      conversation: {
        id: conversation.id,
        messages: conversation.messages,
      } as any,
      knowledgeResults,
    },
    userMessage: text,
    channel,
  });

  // 7. Save AI response
  await addMessage({
    conversationId: conversation.id,
    role: "ASSISTANT",
    content: agentResponse.content,
    channel,
    toolCalls: agentResponse.toolCalls,
  });

  // 8. Send response
  await sendResponse(agentResponse.content);

  // 9. Update usage
  await prisma.business.update({
    where: { id: businessId },
    data: { messagesThisMonth: { increment: 1 } },
  });
}

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.META_APP_SECRET!)
    .update(body)
    .digest("hex");

  return signature === `sha256=${expectedSignature}`;
}
```

### Meta API Helpers

```typescript
// lib/integrations/meta.ts

interface SendWhatsAppParams {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}

export async function sendWhatsAppMessage(params: SendWhatsAppParams) {
  const { accessToken, phoneNumberId, to, text } = params;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}

interface SendInstagramParams {
  accessToken: string;
  recipientId: string;
  text: string;
}

export async function sendInstagramMessage(params: SendInstagramParams) {
  const { accessToken, recipientId, text } = params;

  const response = await fetch(
    `https://graph.facebook.com/v18.0/me/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
  }

  return response.json();
}
```

---

## VAPI WEBHOOK HANDLER

```typescript
// app/api/webhooks/vapi/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { VapiWebhookPayload } from "@/lib/types";
import { findOrCreateCustomer } from "@/lib/services/customer.service";
import { getOrCreateConversation, addMessage } from "@/lib/services/conversation.service";

export async function POST(req: NextRequest) {
  const payload: VapiWebhookPayload = await req.json();

  // Log for debugging
  await prisma.webhookLog.create({
    data: {
      source: "vapi",
      event: payload.message.type,
      payload: payload as unknown as Record<string, unknown>,
    },
  });

  switch (payload.message.type) {
    case "function-call":
      return handleFunctionCall(payload);
    case "end-of-call-report":
      return handleEndOfCall(payload);
    default:
      return NextResponse.json({ success: true });
  }
}

async function handleFunctionCall(payload: VapiWebhookPayload) {
  const { functionCall, call } = payload.message;

  if (!functionCall || !call) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // Find business by assistant ID or phone number
  const integration = await prisma.integration.findFirst({
    where: {
      type: "VAPI",
      OR: [
        { metadata: { path: ["assistantId"], equals: call.assistantId } },
        { platformId: call.phoneNumber.number },
      ],
      isActive: true,
    },
  });

  if (!integration) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  // Execute the function
  const result = await executeVapiFunction(
    functionCall.name,
    functionCall.parameters,
    integration.businessId,
    call.customer?.number
  );

  return NextResponse.json({ result });
}

async function handleEndOfCall(payload: VapiWebhookPayload) {
  const { endOfCallReport, call } = payload.message;

  if (!endOfCallReport || !call) {
    return NextResponse.json({ success: true });
  }

  // Find business
  const integration = await prisma.integration.findFirst({
    where: {
      type: "VAPI",
      OR: [
        { metadata: { path: ["assistantId"], equals: call.assistantId } },
        { platformId: call.phoneNumber.number },
      ],
      isActive: true,
    },
  });

  if (!integration) {
    return NextResponse.json({ success: true });
  }

  // Create/find customer
  const customer = await findOrCreateCustomer({
    businessId: integration.businessId,
    channel: "VOICE",
    platformSenderId: call.customer?.number || call.id,
    phone: call.customer?.number,
  });

  // Create conversation
  const conversation = await getOrCreateConversation({
    businessId: integration.businessId,
    customerId: customer.id,
    channel: "VOICE",
    platformConversationId: call.id,
  });

  // Save transcript as message
  await addMessage({
    conversationId: conversation.id,
    role: "SYSTEM",
    content: endOfCallReport.transcript,
    channel: "VOICE",
    metadata: {
      summary: endOfCallReport.summary,
      duration: endOfCallReport.durationSeconds,
      recordingUrl: endOfCallReport.recordingUrl,
    },
  });

  // Update voice minutes
  await prisma.business.update({
    where: { id: integration.businessId },
    data: {
      voiceMinutesUsed: {
        increment: endOfCallReport.durationSeconds / 60,
      },
    },
  });

  return NextResponse.json({ success: true });
}

async function executeVapiFunction(
  name: string,
  params: Record<string, unknown>,
  businessId: string,
  customerPhone?: string
) {
  // Import and execute tools
  // This bridges Vapi's function calls to your existing tools
  
  switch (name) {
    case "check_availability":
      // Use your existing tool logic
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });
      // ... implement availability check
      return { available: true, slots: ["10:00", "14:00", "16:00"] };

    case "book_appointment":
      // ... implement booking
      return { success: true, appointmentId: "apt_123" };

    case "get_pricing":
      // ... implement pricing lookup
      return { services: [{ name: "Consultation", price: 100 }] };

    default:
      return { error: "Unknown function" };
  }
}
```

---

## CHAT WIDGET

### Widget Script

```javascript
// public/widget.js

(function() {
  const WIDGET_URL = 'https://yourdomain.com/widget';
  
  // Get business slug from script tag
  const script = document.currentScript;
  const businessSlug = script.getAttribute('data-business');
  
  if (!businessSlug) {
    console.error('Chat widget: data-business attribute required');
    return;
  }

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = `${WIDGET_URL}/${businessSlug}`;
  iframe.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    height: 600px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    z-index: 999999;
    display: none;
  `;
  iframe.id = 'ai-chat-widget';

  // Create toggle button
  const button = document.createElement('button');
  button.innerHTML = '💬';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: none;
    background: #2563eb;
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 999998;
  `;

  let isOpen = false;
  button.onclick = () => {
    isOpen = !isOpen;
    iframe.style.display = isOpen ? 'block' : 'none';
    button.innerHTML = isOpen ? '✕' : '💬';
  };

  document.body.appendChild(iframe);
  document.body.appendChild(button);
})();
```

### Widget API

```typescript
// app/api/chat/public/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processMessage, setToolContext } from "@/lib/ai/agent";
import { searchKnowledge } from "@/lib/services/knowledge.service";

export async function POST(req: NextRequest) {
  const { businessSlug, sessionId, message } = await req.json();

  // Find business
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Check rate limit / usage
  if (business.messagesThisMonth >= business.messagesLimit) {
    return NextResponse.json(
      { error: "Usage limit reached", response: "Sorry, please try again later." },
      { status: 429 }
    );
  }

  // Get or create session (simple in-memory or use Redis)
  // For MVP, just process without persistent session
  
  const knowledgeResults = await searchKnowledge(business.id, message, 5);

  setToolContext({
    businessId: business.id,
    customerId: sessionId, // Use session as customer ID for anonymous
    timezone: business.timezone,
  });

  const response = await processMessage({
    context: {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        timezone: business.timezone,
        aiSettings: business.aiSettings as any,
        businessHours: business.businessHours as any,
      },
      customer: {
        id: sessionId,
        recentMessages: [],
        appointments: [],
        tags: [],
      },
      conversation: {
        id: sessionId,
        messages: [],
      } as any,
      knowledgeResults,
    },
    userMessage: message,
    channel: "WEBCHAT",
  });

  // Update usage
  await prisma.business.update({
    where: { id: business.id },
    data: { messagesThisMonth: { increment: 1 } },
  });

  return NextResponse.json({
    response: response.content,
    toolCalls: response.toolCalls,
  });
}
```

---

## MIDDLEWARE (Business Scoping)

```typescript
// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

  // Public routes
  const publicPaths = [
    "/api/webhooks",
    "/api/chat/public",
    "/api/auth",
    "/widget",
    "/login",
    "/signup",
  ];

  if (publicPaths.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Require auth for dashboard
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Add business context to headers for API routes
  const response = NextResponse.next();
  
  if (token.businessId) {
    response.headers.set("x-business-id", token.businessId as string);
  }
  response.headers.set("x-user-role", token.role as string);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## PRISMA MIDDLEWARE (Auto businessId filter)

```typescript
// lib/db.ts

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Models that require business scoping
const SCOPED_MODELS = [
  "customer",
  "conversation",
  "message",
  "appointment",
  "integration",
  "knowledgeItem",
];

// Extension for business scoping (use in API routes)
export function createScopedPrisma(businessId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SCOPED_MODELS.includes(model.toLowerCase())) {
            args.where = { ...args.where, businessId };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SCOPED_MODELS.includes(model.toLowerCase())) {
            args.where = { ...args.where, businessId };
          }
          return query(args);
        },
        async create({ model, args, query }) {
          if (SCOPED_MODELS.includes(model.toLowerCase())) {
            args.data = { ...args.data, businessId };
          }
          return query(args);
        },
      },
    },
  });
}
```

---

## ENV VARIABLES

```bash
# .env.example

# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Encryption
ENCRYPTION_KEY="64-character-hex-string"  # Generate: openssl rand -hex 32

# Meta (WhatsApp/Instagram)
META_APP_ID="..."
META_APP_SECRET="..."
META_WEBHOOK_VERIFY_TOKEN="your-verify-token"

# OpenRouter (LLM)
OPENROUTER_API_KEY="..."

# OpenAI (Embeddings)
OPENAI_API_KEY="..."

# Pinecone
PINECONE_API_KEY="..."
PINECONE_INDEX_NAME="..."

# Vapi
VAPI_API_KEY="..."

# Google Calendar
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## IMPLEMENTATION ORDER

```
WEEK 1:
1. Set up project with Next.js 14, Prisma, NextAuth
2. Create database schema, run migrations
3. Build auth (login, signup, session)
4. Build super admin dashboard (list businesses)
5. Build business dashboard skeleton

WEEK 2:
6. Create Meta Developer app, submit for review
7. Build OAuth connect flow for WhatsApp/Instagram
8. Build Meta webhook handler
9. Build central AI agent (basic version)
10. Test end-to-end with test WhatsApp number

WEEK 3:
11. Build knowledge upload + Pinecone indexing
12. Build RAG into AI agent
13. Build appointment tools
14. Build chat widget + public API
15. Google Calendar integration

WEEK 4:
16. Vapi tool endpoints
17. Business settings UI
18. Usage tracking + limits
19. Stripe billing (basic)
20. Testing + bug fixes + launch
```

---

Use this as your complete project context. Each section is copy-paste ready for implementation.