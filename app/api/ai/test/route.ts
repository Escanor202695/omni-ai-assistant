import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { openrouter, MODELS } from '@/lib/openrouter';
import { db } from '@/lib/db';

/**
 * POST /api/ai/test
 * Test the AI with custom settings (for preview in settings page)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, settings } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get business info for context
    const business = await db.business.findUnique({
      where: { id: session.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Build system prompt with custom settings
    const systemPrompt = `You are the AI assistant for ${business.name}.

PERSONALITY: Be ${settings?.personality || 'professional'} in all interactions.

BUSINESS INFORMATION:
- Name: ${business.name}
- Phone: ${business.phone || 'Not provided'}
- Email: ${business.email || 'Not provided'}
- Website: ${business.website || 'Not provided'}

${settings?.instructions ? `CUSTOM INSTRUCTIONS:\n${settings.instructions}` : ''}

Keep responses concise and helpful. This is a test message, so respond naturally as if talking to a real customer.`;

    // Call OpenRouter
    const response = await openrouter.chat.completions.create({
      model: MODELS.PRIMARY,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = response.choices[0]?.message?.content || 'No response generated';

    return NextResponse.json({ response: aiResponse });
  } catch (error: any) {
    console.error('AI test error:', error);
    return NextResponse.json(
      { error: 'Failed to test AI', details: error.message },
      { status: 500 }
    );
  }
}

