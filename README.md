# Omni AI Assistant - Phase 1

Complete Next.js fullstack AI customer engagement platform.

## 🚀 Features

- **AI-Powered Conversations**: OpenRouter integration with GPT-4 and Claude
- **RAG Knowledge Base**: Pinecone vector database for context-aware responses
- **Appointment Booking**: AI can check availability and book appointments
- **Multi-Channel Support**: WebChat, Voice (Phase 2), WhatsApp (Phase 2)
- **Customer Management**: Track interactions, tags, and notes
- **Analytics Dashboard**: Conversation metrics and trends
- **Subscription Billing**: Stripe integration with usage tracking

## 🏗️ Architecture

**Stack**: Next.js 14 (App Router) • Supabase (Auth + Postgres) • Prisma • OpenRouter • Pinecone • Stripe

**Key Principle**: All business logic lives in `/services` for easy migration to NestJS later.

## 📦 Installation

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# Fill in your API keys

# 3. Set up database
npx prisma generate
npx prisma db push

# 4. Run development server
npm run dev
```

## 🔑 Required Environment Variables

### Supabase (Database + Auth)
1. Create project at https://supabase.com
2. Get URL and anon key from Settings → API
3. Get database URL from Settings → Database
4. Set `DATABASE_URL` and `DIRECT_URL`

### OpenRouter (AI)
1. Sign up at https://openrouter.ai
2. Get API key from Keys page
3. Set `OPENROUTER_API_KEY`

### OpenAI (Embeddings)
1. Get API key from https://platform.openai.com
2. Set `OPENAI_API_KEY`

### Pinecone (Vector DB)
1. Create serverless index at https://pinecone.io
2. Set `PINECONE_API_KEY` and `PINECONE_INDEX`

### Stripe (Billing)
1. Get keys from https://dashboard.stripe.com/test/apikeys
2. Create products and get price IDs
3. Set webhook secret after deploying

## 🗂️ Project Structure

```
omni/
├── app/               # Next.js App Router
│   ├── api/          # API route handlers
│   ├── (auth)/       # Login, register pages
│   └── (dashboard)/  # Main app pages
├── services/         # Business logic (CRITICAL)
├── components/       # React components
├── lib/              # Utilities & clients
├── prisma/           # Database schema
└── types/            # TypeScript types
```

## 🛠️ Development

```bash
# Development
npm run dev

# Database
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:studio      # Open Prisma Studio

# Production
npm run build
npm run start
```

## 🚢 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production
vercel --prod
```

Add all environment variables in Vercel dashboard.

## 📊 Database Schema

- **Business**: Core business entity with AI config
- **User**: Team members linked to Supabase Auth
- **Customer**: End customers across channels
- **Conversation**: Chat sessions
- **Message**: Individual messages
- **Appointment**: Bookings with calendar sync
- **Service**: Bookable services
- **KnowledgeDoc**: Documents for RAG

## 🔐 Authentication Flow

1. User signs up → Supabase Auth creates user
2. API creates Business + User in database
3. Middleware checks Supabase session
4. API routes use `getServerSession()` for businessId

## 🤖 AI Chat Flow

1. User sends message → `/api/chat`
2. Get business, customer, conversation
3. Search knowledge base (RAG)
4. Build system prompt with context
5. Call OpenRouter with tools
6. Handle tool calls (book appointment, escalate)
7. Save response and increment usage

## 📈 When to Migrate to NestJS

Move to separate backend when you hit ANY of:
- Need WebSockets at scale
- Background jobs >1 minute
- 3+ backend engineers
- Infrastructure issues >20% dev time

Migration is painless because services are framework-agnostic.

## 🎯 Phase 2 Features (Not Included)

- Voice calling via Vapi
- WhatsApp integration
- SMS channel
- Real-time WebSockets
- Background job queues
- Redis caching

## 📝 License

MIT

## 🆘 Support

For issues, check:
1. Environment variables are set
2. Database is migrated
3. API keys are valid
4. Logs in console

---

Built with ❤️ for rapid MVP development
