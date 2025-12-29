import { getServerSession } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Users, Calendar, BookOpen, BarChart3, Settings, Building2, Shield } from 'lucide-react';
import { UserRole } from '@prisma/client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  const isSuperAdmin = session.role === UserRole.SUPER_ADMIN;

  const businessNavItems = [
    { href: '/dashboard', label: 'Overview', icon: BarChart3 },
    { href: '/conversations', label: 'Conversations', icon: MessageSquare },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/appointments', label: 'Appointments', icon: Calendar },
    // { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminNavItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: Shield },
    { href: '/admin/businesses', label: 'Businesses', icon: Building2 },
    { href: '/admin/users', label: 'Users', icon: Users },
  ];

  const navItems = isSuperAdmin 
    ? [...adminNavItems, ...businessNavItems]
    : businessNavItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Omni AI</h1>
          <p className="text-sm text-gray-500 mt-1">AI Assistant</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

              <Link
                href="/api/auth/logout"
                className="w-full text-center py-2 bg-red-100 text-sm text-red-500 hover:bg-red-200 hover:text-red-700"
              >
                Logout
              </Link>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isSuperAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </h2>
            <div className="flex items-center gap-4">
              {isSuperAdmin && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                  Super Admin
                </span>
              )}
              <div className='text-right'>
              <p className="text-sm font-medium text-gray-900">+1 (948) 300 9718</p>
              <p className="text-sm text-gray-600">{session.email}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
