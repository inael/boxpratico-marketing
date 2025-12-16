import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Validate directly using environment variables
          // This avoids the need for internal API calls which can fail in Edge Runtime
          const validUsername = process.env.ADMIN_USERNAME || 'admin';
          const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

          console.log('[Auth] Validating credentials for:', credentials.username);
          console.log('[Auth] Expected username:', validUsername);

          if (credentials.username === validUsername && credentials.password === validPassword) {
            console.log('[Auth] Login successful');
            return {
              id: '1',
              name: credentials.username as string,
              email: `${credentials.username}@boxpratico.com`,
            };
          }

          console.log('[Auth] Login failed - credentials mismatch');
          return null;
        } catch (error) {
          console.error('[Auth] Error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnLogin = nextUrl.pathname === '/login';

      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }

      if (isOnLogin && isLoggedIn) {
        return Response.redirect(new URL('/admin', nextUrl));
      }

      return true;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
});
