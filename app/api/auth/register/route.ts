import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/services/auth.service';
import { registerSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    // Check if Supabase env vars are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[POST /api/auth/register] Missing Supabase environment variables');
      return NextResponse.json({ 
        error: 'Server configuration error', 
        message: 'Supabase credentials are not configured' 
      }, { status: 500 });
    }

    const supabase = await createClient();

    // 1. Create auth user in Supabase
    let authData, authError;
    try {
      const result = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      authData = result.data;
      authError = result.error;
    } catch (signUpError: any) {
      console.error('[POST /api/auth/register] Supabase signUp error:', signUpError);
      return NextResponse.json({ 
        error: 'Authentication service error', 
        message: signUpError.message || 'Failed to connect to authentication service. Please check your Supabase configuration.' 
      }, { status: 500 });
    }

    if (authError || !authData.user) {
      return NextResponse.json({ 
        error: authError?.message || 'Registration failed',
        message: authError?.message || 'Failed to create user account'
      }, { status: 400 });
    }

    // 2. Create user + business in our DB
    const { user, business } = await AuthService.createUserWithBusiness(authData.user.id, data);

    return NextResponse.json({
      user,
      business,
      message: 'Registration successful',
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      const errorMessages = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('[POST /api/auth/register] Validation error:', error.errors);
      return NextResponse.json({ 
        error: 'Validation failed', 
        message: errorMessages,
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
