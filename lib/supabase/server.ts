import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { UserRole } from '@prisma/client';

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
          try {
            cookieStore.set(name, value, options);
          } catch {
            // Ignored - cookies can only be modified in Server Actions or Route Handlers
            // This is expected when called from Server Components
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options);
          } catch {
            // Ignored - cookies can only be modified in Server Actions or Route Handlers
          }
        },
      },
    }
  );
}

export interface ServerSession {
  userId: string;
  businessId: string | null; // Nullable for SUPER_ADMIN
  email: string;
  role: UserRole;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  // Get user from our DB
  const dbUser = await db.user.findUnique({
    where: { supabaseUserId: user.id },
    include: { business: true },
  });
  
  if (!dbUser) {
    // User exists in Supabase but not in our DB
    // Don't call signOut here as it won't work in Server Components
    console.error(`Supabase user ${user.id} has no corresponding DB user`);
    return null;
  }
  
  // Super admin has no business
  if (dbUser.role === UserRole.SUPER_ADMIN) {
    return {
      userId: dbUser.id,
      businessId: null,
      email: dbUser.email,
      role: dbUser.role,
    };
  }
  
  // Regular users must have a business
  if (!dbUser.businessId) {
    console.error(`User ${dbUser.id} has role ${dbUser.role} but no businessId`);
    return null; // Invalid state
  }
  
  return {
    userId: dbUser.id,
    businessId: dbUser.businessId,
    email: dbUser.email,
    role: dbUser.role,
  };
}
