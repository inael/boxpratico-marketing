import { auth } from '@/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdmin = req.nextUrl.pathname.startsWith('/admin');
  const isOnLogin = req.nextUrl.pathname === '/login';

  // Protect admin routes
  if (isOnAdmin && !isLoggedIn) {
    return Response.redirect(new URL('/login', req.nextUrl));
  }

  // Redirect logged in users from login to admin
  if (isOnLogin && isLoggedIn) {
    return Response.redirect(new URL('/admin', req.nextUrl));
  }
});

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
};
