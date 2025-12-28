import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { callId: string } }
) {
  try {
    const { callId } = params;

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // Fetch call details from Vapi API
    const vapiResponse = await fetch(
      `https://api.vapi.ai/call/${callId}`,
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
        { error: 'Failed to fetch call details from Vapi', details: errorData },
        { status: vapiResponse.status }
      );
    }

    const callData = await vapiResponse.json();

    return NextResponse.json({
      success: true,
      call: callData,
    });
  } catch (error) {
    console.error('Error fetching Vapi call details:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
