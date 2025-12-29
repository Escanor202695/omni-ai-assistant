import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!session.businessId) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('Received update request for business:', session.businessId);
    console.log('Update payload:', JSON.stringify(body, null, 2));
    
    const {
      name,
      email,
      phone,
      address,
      website,
      timezone,
      businessHoursText,
      servicesOffered,
      aiPersonality,
      aiGreeting,
      aiInstructions,
    } = body;

    // Build update data object
    const updateData: any = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (address !== undefined) updateData.address = address || null;
    if (website !== undefined) updateData.website = website || null;
    if (timezone) updateData.timezone = timezone;
    if (businessHoursText !== undefined) updateData.businessHoursText = businessHoursText || null;
    if (servicesOffered !== undefined) updateData.servicesOffered = servicesOffered || null;
    if (aiPersonality) updateData.aiPersonality = aiPersonality;
    if (aiGreeting !== undefined) updateData.aiGreeting = aiGreeting || null;
    if (aiInstructions !== undefined) updateData.aiInstructions = aiInstructions || null;

    console.log('Prisma update data:', JSON.stringify(updateData, null, 2));

    // Update business
    const updatedBusiness = await db.business.update({
      where: { id: session.businessId },
      data: updateData,
    });

    console.log('Business updated successfully');

    return NextResponse.json({ 
      success: true,
      business: updatedBusiness 
    });
  } catch (error) {
    console.error('Error updating business:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
