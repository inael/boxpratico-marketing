import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser, updateUser } from './database';
import { User, UserRole } from '@/types';

// Estender tipos do NextAuth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: UserRole;
      isAdmin: boolean;
      accountId?: string;
      allowedTerminals?: string[];
      allowedAdvertisers?: string[];
      restrictContent?: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    isAdmin: boolean;
    accountId?: string;
    allowedTerminals?: string[];
    allowedAdvertisers?: string[];
    restrictContent?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    isAdmin: boolean;
    accountId?: string;
    allowedTerminals?: string[];
    allowedAdvertisers?: string[];
    restrictContent?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Login com email/senha
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await getUserByEmail(credentials.email);

        if (!user) {
          throw new Error('Usuário não encontrado');
        }

        if (!user.isActive) {
          throw new Error('Conta desativada. Entre em contato com o suporte.');
        }

        if (!user.passwordHash) {
          throw new Error('Esta conta usa login social. Use o Google para entrar.');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValidPassword) {
          throw new Error('Senha incorreta');
        }

        // Atualizar último login
        await updateUser(user.id, { lastLoginAt: new Date().toISOString() });

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
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Login com Google
      if (account?.provider === 'google') {
        const existingUser = await getUserByEmail(user.email!);

        if (existingUser) {
          if (!existingUser.isActive) {
            return false; // Bloquear conta desativada
          }

          // Atualizar dados do Google se necessário
          if (!existingUser.providerId || existingUser.providerId !== account.providerAccountId) {
            await updateUser(existingUser.id, {
              provider: 'google',
              providerId: account.providerAccountId,
              avatarUrl: user.image || existingUser.avatarUrl,
              emailVerified: true,
              lastLoginAt: new Date().toISOString(),
            });
          } else {
            await updateUser(existingUser.id, { lastLoginAt: new Date().toISOString() });
          }
        } else {
          // Criar novo usuário via Google
          await createUser({
            name: user.name || 'Usuário',
            email: user.email!,
            avatarUrl: user.image || undefined,
            provider: 'google',
            providerId: account.providerAccountId,
            emailVerified: true,
            role: 'viewer', // Role padrão para novos usuários
            isAdmin: false,
            isActive: true,
          });
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // Primeiro login - adicionar dados do usuário ao token
      if (user) {
        // Buscar usuário completo do banco
        const dbUser = await getUserByEmail(user.email!);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.isAdmin = dbUser.isAdmin;
          token.accountId = dbUser.accountId;
          token.allowedTerminals = dbUser.allowedTerminals;
          token.allowedAdvertisers = dbUser.allowedAdvertisers;
          token.restrictContent = dbUser.restrictContent;
        }
      }

      // Atualização de sessão (quando chama update())
      if (trigger === 'update' && session) {
        const dbUser = await getUserByEmail(token.email!);
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
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.isAdmin = token.isAdmin;
      session.user.accountId = token.accountId;
      session.user.allowedTerminals = token.allowedTerminals;
      session.user.allowedAdvertisers = token.allowedAdvertisers;
      session.user.restrictContent = token.restrictContent;

      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Helper para hash de senha
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper para verificar senha
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Manter função legada para compatibilidade
export function checkAuth(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  return password === adminPassword;
}
