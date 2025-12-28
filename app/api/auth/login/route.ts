import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  console.log('[POST /api/auth/login] Request received');
  
  try {
    const body = await req.json();
    console.log('[POST /api/auth/login] Body parsed, email:', body.email);
    
    const data = loginSchema.parse(body);

    const supabase = await createClient();
    console.log('[POST /api/auth/login] Supabase client created');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log('[POST /api/auth/login] Auth result:', { 
      hasUser: !!authData?.user, 
      error: authError?.message 
    });

    if (authError || !authData.user) {
      return NextResponse.json({ 
        error: authError?.message || 'Invalid credentials' 
      }, { status: 401 });
    }

    return NextResponse.json({
      message: 'Login successful',
      user: authData.user,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    
    console.error('[POST /api/auth/login] Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
