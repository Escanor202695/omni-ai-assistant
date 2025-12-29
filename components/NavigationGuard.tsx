'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface SessionData {
  role: string;
  businessId?: string;
}

export function NavigationGuard({ business }: { business: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    // Fetch session data
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(() => setSession(null));
  }, []);

  useEffect(() => {
    if (!session) return;

    // Only apply guard for non-super-admin users
    if (session.role === 'SUPER_ADMIN') return;

    // Allow access to settings page even without AI agent
    if (pathname === '/settings') return;

    // If no business or no AI agent configured, redirect to settings
    if (!business || !business.vapiAssistantId) {
      router.push('/settings');
    }
  }, [business, pathname, router, session]);

  return null;
}