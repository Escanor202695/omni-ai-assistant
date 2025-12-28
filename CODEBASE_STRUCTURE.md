# Omni AI Assistant - Complete Codebase Structure

This document provides a comprehensive overview of the entire codebase structure, explaining what each file and directory does.

---

## 📁 Visual Directory Tree

```
omni-ai-assistant/
├── 📁 app/                          # Next.js App Router
│   ├── 📁 (auth)/                   # Auth route group (URL: /login, /register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── 📁 (dashboard)/              # Dashboard route group
│   │   ├── layout.tsx              # Dashboard layout (sidebar, nav)
│   │   ├── dashboard/page.tsx      # /dashboard (overview)
│   │   ├── analytics/page.tsx      # /dashboard/analytics
│   │   ├── appointments/page.tsx   # /dashboard/appointments
│   │   ├── conversations/page.tsx  # /dashboard/conversations
│   │   ├── customers/page.tsx      # /dashboard/customers
│   │   ├── knowledge/page.tsx      # /dashboard/knowledge
│   │   └── settings/page.tsx       # /dashboard/settings
│   ├── 📁 api/                      # API Routes (REST endpoints)
│   │   ├── auth/
│   │   │   ├── login/route.ts      # POST /api/auth/login
│   │   │   ├── register/route.ts   # POST /api/auth/register
│   │   │   ├── logout/route.ts     # POST /api/auth/logout
│   │   │   └── me/route.ts         # GET /api/auth/me
│   │   ├── chat/route.ts           # POST /api/chat (AI chat)
│   │   ├── conversations/route.ts  # GET, POST /api/conversations
│   │   ├── customers/route.ts      # GET, POST /api/customers
│   │   ├── appointments/route.ts   # GET, POST /api/appointments
│   │   ├── knowledge/route.ts      # GET, POST /api/knowledge
│   │   └── analytics/route.ts      # GET /api/analytics
│   ├── layout.tsx                  # Root layout (HTML, providers)
│   ├── page.tsx                    # Homepage (/) - redirects
│   └── globals.css                 # Global styles
│
├── 📁 components/                   # React Components
│   ├── 📁 ui/                      # UI component library
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── 📁 layout/                  # Layout components (empty)
│   └── 📁 shared/                  # Shared components (empty)
│
├── 📁 services/                     # ⚡ BUSINESS LOGIC (framework-agnostic)
│   ├── ai.service.ts               # AI/LLM (OpenRouter)
│   ├── rag.service.ts              # RAG with Pinecone
│   ├── business.service.ts         # Business CRUD
│   ├── customer.service.ts         # Customer management
│   ├── conversation.service.ts     # Conversation management
│   ├── appointment.service.ts      # Appointment booking
│   ├── knowledge.service.ts        # Knowledge base
│   ├── analytics.service.ts        # Analytics calculations
│   └── auth.service.ts             # Auth helpers
│
├── 📁 lib/                          # Libraries & Utilities
│   ├── db.ts                       # Prisma client singleton
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   └── server.ts              # Server Supabase client & session
│   ├── openrouter.ts              # OpenRouter API client
│   ├── pinecone.ts                # Pinecone client
│   ├── stripe.ts                  # Stripe client (future)
│   ├── constants.ts               # App constants
│   ├── validations.ts             # Zod schemas
│   └── utils.ts                   # Utility functions
│
├── 📁 prisma/
│   └── schema.prisma              # Database schema (models, enums)
│
├── 📁 types/
│   └── index.ts                   # TypeScript type definitions
│
├── 📁 hooks/                       # Custom React hooks (empty)
│
├── 📄 Configuration Files
│   ├── package.json               # Dependencies & scripts
│   ├── tsconfig.json              # TypeScript config
│   ├── next.config.js             # Next.js config
│   ├── tailwind.config.ts         # Tailwind CSS config
│   ├── postcss.config.js          # PostCSS config
│   ├── middleware.ts              # Next.js middleware (auth)
│   └── vercel.json                # Vercel deployment config
│
├── 📄 Environment Files
│   ├── .env                       # Local env vars (gitignored)
│   ├── .env.local                 # Local overrides
│   └── .env.example               # Template
│
└── 📄 Documentation
    ├── README.md                  # Main docs
    ├── QUICK_START.md             # Setup guide
    ├── STATUS_CHECKLIST.md        # Feature status
    ├── ADMIN_AND_INTEGRATIONS.md  # Admin & Meta docs
    └── CODEBASE_STRUCTURE.md      # This file
```

---

## 📁 Root Directory Overview

```
omni-ai-assistant/
├── app/                      # Next.js App Router (pages, API routes, layouts)
├── components/               # React components
├── hooks/                    # Custom React hooks (empty - for future use)
├── lib/                      # Utility libraries and client configurations
├── prisma/                   # Database schema and migrations
├── services/                 # Business logic layer (framework-agnostic)
├── types/                    # TypeScript type definitions
├── .env                      # Environment variables (local, gitignored)
├── .env.example              # Environment variables template
├── .env.local                # Local environment overrides
├── .gitignore                # Git ignore rules
├── ADMIN_AND_INTEGRATIONS.md # Documentation for admin & Meta integrations
├── CODEBASE_STRUCTURE.md     # This file
├── QUICK_START.md            # Quick setup guide
├── README.md                 # Main project documentation
├── STATUS_CHECKLIST.md       # Feature implementation status
├── middleware.ts             # Next.js middleware (auth, redirects)
├── next.config.js            # Next.js configuration
├── next-env.d.ts             # Next.js TypeScript definitions (auto-generated)
├── package.json              # NPM dependencies and scripts
├── package-lock.json         # Locked dependency versions
├── postcss.config.js         # PostCSS configuration (for Tailwind)
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── vercel.json               # Vercel deployment configuration
```

---

## 📂 Directory Breakdown

### `/app` - Next.js App Router

The main application directory following Next.js 13+ App Router conventions.

```
app/
├── (auth)/                   # Route group for authentication pages
│   ├── login/
│   │   └── page.tsx         # Login page component
│   └── register/
│       └── page.tsx         # Registration page component
│
├── (dashboard)/              # Route group for dashboard (protected)
│   ├── layout.tsx           # Dashboard layout (sidebar, nav)
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard overview/home page
│   ├── analytics/
│   │   └── page.tsx         # Analytics page
│   ├── appointments/
│   │   └── page.tsx         # Appointments list page
│   ├── conversations/
│   │   └── page.tsx         # Conversations list page
│   ├── customers/
│   │   └── page.tsx         # Customers list page
│   ├── knowledge/
│   │   └── page.tsx         # Knowledge base management page
│   └── settings/
│       └── page.tsx         # Settings page
│
├── api/                      # API route handlers (Next.js API routes)
│   ├── auth/
│   │   ├── login/
│   │   │   └── route.ts     # POST /api/auth/login
│   │   ├── logout/
│   │   │   └── route.ts     # POST /api/auth/logout
│   │   ├── me/
│   │   │   └── route.ts     # GET /api/auth/me (current user)
│   │   └── register/
│   │       └── route.ts     # POST /api/auth/register
│   │
│   ├── analytics/
│   │   └── route.ts         # GET /api/analytics
│   │
│   ├── appointments/
│   │   └── route.ts         # GET, POST /api/appointments
│   │
│   ├── chat/
│   │   └── route.ts         # POST /api/chat (AI chat endpoint)
│   │
│   ├── conversations/
│   │   └── route.ts         # GET, POST /api/conversations
│   │
│   ├── customers/
│   │   └── route.ts         # GET, POST /api/customers
│   │
│   └── knowledge/
│       └── route.ts         # GET, POST /api/knowledge
│
├── layout.tsx                # Root layout (HTML structure, providers)
├── page.tsx                  # Root page (redirects to login/dashboard)
└── globals.css               # Global CSS styles
```

#### File Details:

- **`app/layout.tsx`**: Root layout that wraps all pages. Sets up HTML structure, metadata, and global providers (like Toaster for notifications).

- **`app/page.tsx`**: Homepage route (`/`). Checks authentication and redirects to `/dashboard` (authenticated) or `/login` (not authenticated).

- **`app/(auth)/login/page.tsx`**: Login page. Handles user authentication form, calls `/api/auth/login`, and redirects to dashboard on success.

- **`app/(auth)/register/page.tsx`**: Registration page. Handles new user signup, calls `/api/auth/register`, creates business and user.

- **`app/(dashboard)/layout.tsx`**: Dashboard layout with sidebar navigation, header, and main content area. Shared across all dashboard routes.

- **`app/(dashboard)/dashboard/page.tsx`**: Dashboard overview page showing metrics, recent conversations, and quick stats.

- **`app/(dashboard)/*/page.tsx`**: Individual feature pages for analytics, appointments, conversations, customers, knowledge, and settings.

- **`app/api/**/route.ts`\*\*: API route handlers. Each file exports HTTP methods (GET, POST, etc.) that handle specific endpoints.

---

### `/components` - React Components

```
components/
├── layout/                   # Layout components (empty - for future use)
├── shared/                   # Shared/common components (empty - for future use)
└── ui/                       # UI component library (shadcn/ui style)
    ├── button.tsx           # Button component
    ├── card.tsx             # Card container component
    └── input.tsx            # Input field component
```

#### File Details:

- **`components/ui/*.tsx`**: Reusable UI components following shadcn/ui patterns. These are basic building blocks for forms, cards, buttons, etc.

- **`components/layout/`**: Reserved for layout-specific components (headers, sidebars, etc.)

- **`components/shared/`**: Reserved for shared components used across multiple pages

---

### `/services` - Business Logic Layer

**Critical Directory**: All business logic lives here. Framework-agnostic, making migration to NestJS easy.

```
services/
├── ai.service.ts            # AI/LLM service (OpenRouter integration)
├── analytics.service.ts     # Analytics calculations
├── appointment.service.ts   # Appointment booking logic
├── auth.service.ts          # Authentication helpers
├── business.service.ts      # Business CRUD and management
├── conversation.service.ts  # Conversation management
├── customer.service.ts      # Customer management
├── knowledge.service.ts     # Knowledge base operations
└── rag.service.ts           # RAG (Retrieval-Augmented Generation) with Pinecone
```

#### File Details:

- **`ai.service.ts`**:

  - Handles OpenRouter API calls (GPT-4, Claude)
  - Builds system prompts with business context
  - Manages tool calls (book appointment, escalate)
  - Formats messages and handles responses

- **`rag.service.ts`**:

  - Vector search using Pinecone
  - Generates embeddings with OpenAI
  - Retrieves relevant knowledge documents
  - Chunks and indexes documents

- **`business.service.ts`**:

  - Business CRUD operations
  - Usage tracking (monthly interactions, voice minutes)
  - Business configuration management

- **`conversation.service.ts`**:

  - Create/get conversations
  - Add messages to conversations
  - Conversation status management (active, resolved, escalated)

- **`customer.service.ts`**:

  - Customer CRUD operations
  - Customer search and filtering
  - Tag management
  - Customer statistics

- **`appointment.service.ts`**:

  - Appointment booking logic
  - Availability checking (future: Google Calendar integration)
  - Appointment status management

- **`knowledge.service.ts`**:

  - Knowledge document CRUD
  - Document processing status
  - Knowledge base queries

- **`analytics.service.ts`**:

  - Calculate metrics (conversations, customers, appointments)
  - Response time averages
  - Usage statistics

- **`auth.service.ts`**:
  - Create user with business (on registration)
  - User lookup by Supabase ID or email
  - Authentication helper functions

---

### `/lib` - Libraries & Utilities

```
lib/
├── constants.ts             # App-wide constants
├── db.ts                    # Prisma client singleton
├── openrouter.ts            # OpenRouter API client
├── pinecone.ts              # Pinecone client
├── stripe.ts                # Stripe client (for future billing)
├── supabase/
│   ├── client.ts           # Supabase client (browser)
│   └── server.ts           # Supabase server client & session helpers
├── utils.ts                 # Utility functions (cn, etc.)
└── validations.ts           # Zod validation schemas
```

#### File Details:

- **`lib/db.ts`**:

  - Exports Prisma client singleton
  - Ensures single instance across app
  - Connection pooling handled by Prisma

- **`lib/supabase/client.ts`**:

  - Browser-side Supabase client
  - Used in client components for auth

- **`lib/supabase/server.ts`**:

  - Server-side Supabase client
  - `createClient()` - Creates server client
  - `getServerSession()` - Gets current user session with business info

- **`lib/openrouter.ts`**:

  - OpenRouter API client configuration
  - Exports configured OpenRouter instance

- **`lib/pinecone.ts`**:

  - Pinecone client initialization
  - Exports configured Pinecone instance

- **`lib/stripe.ts`**:

  - Stripe client (for future billing features)
  - Currently placeholder

- **`lib/constants.ts`**:

  - App-wide constants (models, channels, etc.)
  - Centralized configuration

- **`lib/validations.ts`**:

  - Zod schemas for request validation
  - `loginSchema`, `registerSchema`, etc.

- **`lib/utils.ts`**:
  - Utility functions (e.g., `cn()` for className merging)
  - Shared helpers

---

### `/prisma` - Database Schema

```
prisma/
└── schema.prisma            # Prisma schema file (database models)
```

#### File Details:

- **`schema.prisma`**:
  - Defines all database models (Business, User, Customer, Conversation, Message, Appointment, Service, KnowledgeDoc)
  - Enums (Industry, Channel, ConversationStatus, etc.)
  - Relationships and indexes
  - Database connection configuration

---

### `/types` - TypeScript Types

```
types/
└── index.ts                 # TypeScript type definitions
```

#### File Details:

- **`types/index.ts`**:
  - Shared TypeScript interfaces and types
  - API response types
  - Pagination types
  - Custom type definitions

---

### `/hooks` - Custom React Hooks

```
hooks/                       # Empty directory (reserved for future use)
```

#### Purpose:

- Placeholder for custom React hooks (e.g., `useAuth`, `useConversations`, etc.)

---

## 📄 Root Configuration Files

### `package.json`

- NPM package configuration
- Dependencies list
- Scripts (`dev`, `build`, `start`, `db:generate`, `db:push`, etc.)

### `tsconfig.json`

- TypeScript compiler configuration
- Path aliases (`@/*` → `./`)
- Type checking rules

### `next.config.js`

- Next.js framework configuration
- Environment variable handling
- Build optimizations

### `tailwind.config.ts`

- Tailwind CSS configuration
- Theme customization
- Plugin configuration

### `postcss.config.js`

- PostCSS configuration
- Tailwind CSS plugin setup

### `middleware.ts`

- Next.js middleware
- Authentication checks
- Route protection
- Session validation
- Redirects (login/dashboard)

### `vercel.json`

- Vercel deployment configuration
- Environment variables
- Build settings

### `.env` / `.env.local`

- Environment variables
- API keys (Supabase, OpenRouter, OpenAI, Pinecone, Stripe)
- Database URLs
- **Never commit to git!**

---

## 🔄 Data Flow

### Typical Request Flow:

```
1. User action (button click, form submit)
   ↓
2. Frontend component (app/**/page.tsx)
   ↓
3. API call to route (app/api/**/route.ts)
   ↓
4. Service layer (services/*.service.ts)
   ↓
5. Database (via Prisma - lib/db.ts)
   ↓
6. External APIs (OpenRouter, Pinecone, etc.)
   ↓
7. Response back through layers
```

### Example: AI Chat Flow

```
User sends message
  → app/(dashboard)/chat/page.tsx (frontend)
  → POST /api/chat
  → app/api/chat/route.ts
  → AIService.chat()
  → RAGService.search() (Pinecone)
  → OpenRouter API call (lib/openrouter.ts)
  → ConversationService.addMessage()
  → Database (Prisma)
  → Response with AI message
```

---

## 🗂️ Key Architectural Patterns

### 1. **Service Layer Pattern**

- All business logic in `/services`
- Framework-agnostic (no Next.js dependencies)
- Easy to migrate to NestJS later
- API routes are thin wrappers around services

### 2. **Route Groups**

- `(auth)` and `(dashboard)` are Next.js route groups
- Used for organization (don't appear in URL)
- Share layouts within groups

### 3. **API Routes**

- RESTful endpoints in `app/api/**/route.ts`
- Each file exports HTTP methods
- Use services for business logic

### 4. **Server Components**

- Default in Next.js App Router
- Run on server (can access database directly)
- No client JavaScript unless marked `'use client'`

### 5. **Type Safety**

- TypeScript throughout
- Prisma generates types from schema
- Zod for runtime validation

---

## 📊 Database Models Overview

From `prisma/schema.prisma`:

1. **Business**: Core business entity (subscription, AI config, integrations)
2. **User**: Team members (linked to Supabase Auth, belongs to Business)
3. **Customer**: End customers (phone, email, WhatsApp ID, tags)
4. **Conversation**: Chat sessions (channel, status, AI analysis)
5. **Message**: Individual messages in conversations (role, content, metadata)
6. **Appointment**: Bookings (service, time, status, calendar sync)
7. **Service**: Bookable services (name, duration, price)
8. **KnowledgeDoc**: RAG documents (content, type, vector IDs)

---

## 🔐 Authentication Flow

1. User registers → Supabase Auth creates user
2. `AuthService.createUserWithBusiness()` creates Business + User records
3. Session stored in cookies (Supabase handles this)
4. `middleware.ts` checks session on each request
5. `getServerSession()` retrieves user + business info
6. API routes use session for authorization

---

## 🚀 Getting Started with New Features

### Adding a New Page:

1. Create `app/(dashboard)/new-page/page.tsx`
2. Add navigation link in `app/(dashboard)/layout.tsx`

### Adding a New API Route:

1. Create `app/api/new-route/route.ts`
2. Export HTTP methods (GET, POST, etc.)
3. Use services for business logic

### Adding a New Service:

1. Create `services/new.service.ts`
2. Export class with static methods
3. Use Prisma client from `lib/db.ts`

### Adding a New Database Model:

1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate`
3. Run `npm run db:push`

---

## 📝 Notes

- **Environment Variables**: Always add to `.env.example` (never commit actual `.env`)
- **Services**: Keep framework-agnostic (no Next.js imports)
- **API Routes**: Keep thin, delegate to services
- **Components**: Use server components by default, `'use client'` only when needed
- **Types**: Define in `types/index.ts` for shared types
- **Validation**: Use Zod schemas in `lib/validations.ts`

---

## 🔍 Finding Things

- **Authentication**: `lib/supabase/`, `services/auth.service.ts`, `app/api/auth/`
- **Database Models**: `prisma/schema.prisma`
- **Business Logic**: `services/*.service.ts`
- **API Endpoints**: `app/api/**/route.ts`
- **Pages**: `app/**/page.tsx`
- **Types**: `types/index.ts`
- **Constants**: `lib/constants.ts`
- **Utilities**: `lib/utils.ts`

---

**Last Updated**: Based on current codebase structure
**Total Files**: ~60+ TypeScript/TSX files, plus configuration files
