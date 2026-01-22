import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  });

  const isLoggedIn = !!token;
  const isOnAdmin = request.nextUrl.pathname.startsWith('/admin');
  const isOnLogin = request.nextUrl.pathname === '/login';

  // Protect admin routes
  if (isOnAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect logged in users from login to admin
  if (isOnLogin && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
};
