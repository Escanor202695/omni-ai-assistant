import { getServerSession } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const session = await getServerSession();
  
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}

