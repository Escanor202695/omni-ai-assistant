# Omni AI Assistant - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Extract & Install

```bash
# Extract the archive
tar -xzf omni-ai-assistant.tar.gz
cd omni-ai-assistant

# Install dependencies
npm install
```

### Step 2: Set Up Supabase (Free)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to **Settings** → **API**
   - Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
4. Go to **Settings** → **Database**
   - Copy connection string → `DATABASE_URL` and `DIRECT_URL`

### Step 3: Set Up AI Services

**OpenRouter** (For AI chat - $5 free credit)
1. Sign up at https://openrouter.ai
2. Get API key → `OPENROUTER_API_KEY`

**OpenAI** (For embeddings)
1. Get API key from https://platform.openai.com
2. Set `OPENAI_API_KEY`

**Pinecone** (For knowledge base - Free tier)
1. Create account at https://pinecone.io
2. Create a serverless index named "omni-knowledge"
3. Get API key → `PINECONE_API_KEY`
4. Set `PINECONE_INDEX=omni-knowledge`

### Step 4: Configure Environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit .env.local and fill in the values from above
nano .env.local  # or use any text editor
```

**Minimum Required Variables:**
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
OPENROUTER_API_KEY=
OPENAI_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX=omni-knowledge
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### Step 6: Run the App

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

## 🎉 You're Ready!

1. Go to http://localhost:3000
2. Click "Sign up" to create your account
3. Fill in your business details
4. Start using the AI assistant!

## 📱 Test the AI Chat

The main AI endpoint is at `/api/chat`. You can test it:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, I need help booking an appointment",
    "businessId": "YOUR_BUSINESS_ID",
    "customerId": "YOUR_CUSTOMER_ID"
  }'
```

## 🔧 Optional: Stripe Setup (For Billing)

Only needed if you want to enable subscription billing:

1. Get keys from https://dashboard.stripe.com/test/apikeys
2. Create products and pricing
3. Set in `.env.local`:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_PROFESSIONAL`

## 📊 Database Admin

View and edit your database:
```bash
npm run db:studio
# Opens Prisma Studio at http://localhost:5555
```

## 🚢 Deploying to Production

### Vercel (Recommended - Free tier available)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

Don't forget to update `NEXT_PUBLIC_APP_URL` to your production URL!

## 🐛 Troubleshooting

**Database connection errors:**
- Check your DATABASE_URL is correct
- Make sure Supabase project is running

**AI not responding:**
- Verify OPENROUTER_API_KEY is valid
- Check you have credits in OpenRouter account

**Vector search not working:**
- Verify PINECONE_INDEX exists
- Check PINECONE_API_KEY is correct

**Build errors:**
- Run `npm install` again
- Delete node_modules and .next, then reinstall

## 📚 Next Steps

1. **Add Knowledge**: Go to /knowledge and add FAQ documents
2. **Customize AI**: Go to /settings → AI Configuration
3. **Add Services**: Create your bookable services
4. **Test Chat**: Try the chat interface

## 💡 Tips

- The AI uses RAG to search your knowledge base automatically
- Add detailed service descriptions for better AI responses
- Use tags to organize customers
- Check analytics to track performance

## 🆘 Need Help?

Check the README.md for detailed architecture documentation.

---

**Happy Building! 🚀**
