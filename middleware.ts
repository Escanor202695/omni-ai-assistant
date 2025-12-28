import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          request.cookies.set(name, '');
          response.cookies.set(name, '', options);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/register');

  // All dashboard routes (including those in (dashboard) folder)
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
                           request.nextUrl.pathname.startsWith('/admin') ||
                           request.nextUrl.pathname.startsWith('/conversations') ||
                           request.nextUrl.pathname.startsWith('/customers') ||
                           request.nextUrl.pathname.startsWith('/appointments') ||
                           request.nextUrl.pathname.startsWith('/knowledge') ||
                           request.nextUrl.pathname.startsWith('/analytics') ||
                           request.nextUrl.pathname.startsWith('/settings');

  // Public routes - no auth required
  const isPublicRoute = request.nextUrl.pathname.startsWith('/api/webhooks') ||
                        request.nextUrl.pathname.startsWith('/api/chat/public') ||
                        request.nextUrl.pathname.startsWith('/api/auth') ||
                        request.nextUrl.pathname === '/';

  if (isPublicRoute) {
    return response;
  }

  // Redirect to login if not authenticated and trying to access protected routes
  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/chat).*)'],
};
