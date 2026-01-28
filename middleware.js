import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // If user is logged in and tries to access login or register page, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // If user is NOT logged in and tries to access protected route, redirect to home page
  const protectedRoutes = ['/dashboard', '/profile', '/create-event', '/analytics', '/qrscanner', '/tickets'];
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Don't check onboarding in middleware - let dashboard page check DB directly
  // This prevents stale token flags from causing redirect loops

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
