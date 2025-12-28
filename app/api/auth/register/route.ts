import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuthService } from '@/services/auth.service';
import { registerSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const supabase = await createClient();

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Registration failed' }, { status: 400 });
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
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
