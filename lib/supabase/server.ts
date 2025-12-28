import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export async function createClient() {
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', options);
        },
      },
    }
  );
}

export interface ServerSession {
  userId: string;
  businessId: string;
  email: string;
  role: string;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get user from our DB with business
  const dbUser = await db.user.findUnique({
    where: { supabaseUserId: user.id },
    include: { business: true },
  });
  
  if (!dbUser) return null;
  
  return {
    userId: dbUser.id,
    businessId: dbUser.businessId,
    email: dbUser.email,
    role: dbUser.role,
  };
}
