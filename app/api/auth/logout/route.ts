import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Redirect to login page after logout
    return NextResponse.redirect(new URL('/login', req.url));
  } catch (error) {
    console.error('[GET /api/auth/logout]', error);
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('[POST /api/auth/logout]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
