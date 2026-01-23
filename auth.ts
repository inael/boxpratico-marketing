import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { UserRole, Role } from '@/types';

// Tipo de role que suporta legado e novo RBAC
type AnyRole = UserRole | Role;

// Estender tipos do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: AnyRole;
      isAdmin: boolean;
      accountId?: string;
      tenantId?: string;
      allowedTerminals?: string[];
      allowedAdvertisers?: string[];
      restrictContent?: boolean;
    };
  }

  interface User {
    id: string;
    role: AnyRole;
    isAdmin: boolean;
    accountId?: string;
    tenantId?: string;
    allowedTerminals?: string[];
    allowedAdvertisers?: string[];
    restrictContent?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: AnyRole;
    isAdmin: boolean;
    accountId?: string;
    tenantId?: string;
    allowedTerminals?: string[];
    allowedAdvertisers?: string[];
    restrictContent?: boolean;
  }
}

// Função para chamar API interna de autenticação
async function authenticateUser(email: string, password: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[Auth] Error calling verify API:', error);
    return null;
  }
}

// Função para buscar/criar usuário Google via API
async function handleGoogleUser(email: string, name: string, image: string | null, providerId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, image, providerId }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[Auth] Error calling google API:', error);
    return null;
  }
}

// Função para buscar usuário por email via API
async function getUserData(email: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';
  try {
    const response = await fetch(`${baseUrl}/api/auth/user?email=${encodeURIComponent(email)}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[Auth] Error fetching user data:', error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Login com Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),

    // Login com email/senha
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Primeiro verificar se é admin do sistema (legado)
        const validUsername = process.env.ADMIN_USERNAME || 'admin';
        const validPassword = process.env.ADMIN_PASSWORD || 'admin123';

        // Login admin legado (por username)
        if (credentials.email === validUsername && credentials.password === validPassword) {
          console.log('[Auth] Login admin legado');
          return {
            id: 'admin-legacy',
            name: validUsername,
            email: `${validUsername}@boxpratico.com`,
            role: 'admin' as UserRole,
            isAdmin: true,
          };
        }

        // Chamar API interna para autenticar
        const user = await authenticateUser(
          credentials.email as string,
          credentials.password as string
        );

        if (!user) {
          console.log('[Auth] Autenticação falhou:', credentials.email);
          return null;
        }

        console.log('[Auth] Login bem-sucedido:', credentials.email);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
          isAdmin: user.isAdmin,
          accountId: user.accountId,
          allowedTerminals: user.allowedTerminals,
          allowedAdvertisers: user.allowedAdvertisers,
          restrictContent: user.restrictContent,
        };
      },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      // Login com Google
      if (account?.provider === 'google') {
        const result = await handleGoogleUser(
          user.email!,
          user.name || 'Usuário',
          user.image || null,
          account.providerAccountId
        );

        if (!result) {
          console.log('[Auth Google] Falha ao processar usuário:', user.email);
          return false;
        }

        if (result.blocked) {
          console.log('[Auth Google] Conta desativada:', user.email);
          return false;
        }

        // Atualizar user com dados do banco
        user.id = result.id;
        user.role = result.role;
        user.isAdmin = result.isAdmin;
        user.accountId = result.accountId;
        user.allowedTerminals = result.allowedTerminals;
        user.allowedAdvertisers = result.allowedAdvertisers;
        user.restrictContent = result.restrictContent;

        console.log('[Auth Google] Usuário processado:', user.email);
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Primeiro login - adicionar dados do usuário ao token
      if (user) {
        // Se é admin legado
        if (user.id === 'admin-legacy') {
          token.id = user.id;
          token.role = 'admin';
          token.isAdmin = true;
          return token;
        }

        // Dados vêm do authorize/Google
        token.id = user.id;
        token.role = user.role || 'viewer';
        token.isAdmin = user.isAdmin || false;
        token.accountId = user.accountId;
        token.allowedTerminals = user.allowedTerminals;
        token.allowedAdvertisers = user.allowedAdvertisers;
        token.restrictContent = user.restrictContent;
      }

      // Atualização de sessão (quando chama update())
      if (trigger === 'update' && session && token.email) {
        const dbUser = await getUserData(token.email);
        if (dbUser) {
          token.role = dbUser.role;
          token.isAdmin = dbUser.isAdmin;
          token.accountId = dbUser.accountId;
          token.allowedTerminals = dbUser.allowedTerminals;
          token.allowedAdvertisers = dbUser.allowedAdvertisers;
          token.restrictContent = dbUser.restrictContent;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Adicionar dados extras à sessão
      session.user.id = token.id || token.sub || '';
      session.user.role = token.role || 'viewer';
      session.user.isAdmin = token.isAdmin || false;
      session.user.accountId = token.accountId;
      session.user.allowedTerminals = token.allowedTerminals;
      session.user.allowedAdvertisers = token.allowedAdvertisers;
      session.user.restrictContent = token.restrictContent;

      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
};

// Export authOptions para uso em getServerSession
