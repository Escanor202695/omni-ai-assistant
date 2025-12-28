import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '50';
    const assistantId = searchParams.get('assistantId');

    // Build query parameters
    const queryParams = new URLSearchParams({
      limit,
      ...(assistantId && { assistantId }),
    });

    // Fetch calls from Vapi API
    const vapiResponse = await fetch(
      `https://api.vapi.ai/call?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.VAPI_PRIVATE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!vapiResponse.ok) {
      const errorData = await vapiResponse.json();
      console.error('Vapi API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch calls from Vapi', details: errorData },
        { status: vapiResponse.status }
      );
    }

    const calls = await vapiResponse.json();

    return NextResponse.json({
      success: true,
      calls: calls || [],
      total: calls?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching Vapi calls:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
