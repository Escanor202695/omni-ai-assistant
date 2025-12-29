import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { db } from '@/lib/db';

/**
 * DELETE /api/integrations/[id]
 * Disconnect an integration (mark as inactive)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integration = await db.integration.findFirst({
      where: {
        id: params.id,
        businessId: session.businessId,
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Mark as inactive instead of deleting (preserves history)
    await db.integration.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error disconnecting integration:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}


