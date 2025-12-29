import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';

/**
 * GET /api/businesses
 * Get the current user's business
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.businessId) {
      return NextResponse.json({ error: 'No business associated' }, { status: 404 });
    }

    const business = await db.business.findUnique({
      where: { id: session.businessId },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error: any) {
    console.error('[GET /api/businesses]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * PATCH /api/businesses
 * Update the current user's business
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.businessId) {
      return NextResponse.json({ error: 'No business associated' }, { status: 404 });
    }

    const body = await req.json();

    // Only allow updating certain fields (combined from both versions)
    const allowedFields = [
      'name',
      'email',
      'phone',
      'address',
      'website',
      'timezone',
      'industry',
      'aiPersonality',
      'aiGreeting',
      'aiInstructions',
      'businessHours',
      'businessHoursText',    // From friend's version (for AI context)
      'servicesOffered',      // From friend's version (for AI context)
      'bookingBuffer',
      'bookingAdvanceDays',
      'webchatEnabled',
      'vapiAssistantId',      // For VAPI integration
      'vapiPhoneNumber',      // For VAPI integration
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Handle null values properly
        updateData[field] = body[field] === '' ? null : body[field];
      }
    }

    const business = await db.business.update({
      where: { id: session.businessId },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true,
      business 
    });
  } catch (error: any) {
    console.error('[PATCH /api/businesses]', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
