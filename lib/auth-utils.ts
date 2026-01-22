import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { Permission, hasPermission, hasAllPermissions, hasAnyPermission, User, UserRole } from '@/types';
import { getUserByEmail } from './database';

// Tipo da sessão autenticada
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  accountId?: string;
  allowedTerminals?: string[];
  allowedAdvertisers?: string[];
  restrictContent?: boolean;
}

// Resposta de erro padronizada
export function unauthorizedResponse(message = 'Não autorizado') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Acesso negado') {
  return NextResponse.json({ error: message }, { status: 403 });
}

// Obter usuário autenticado da sessão
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email,
    role: session.user.role || 'viewer',
    isAdmin: session.user.isAdmin || false,
    accountId: session.user.accountId,
    allowedTerminals: session.user.allowedTerminals,
    allowedAdvertisers: session.user.allowedAdvertisers,
    restrictContent: session.user.restrictContent,
  };
}

// Verificar se usuário está autenticado
export async function requireAuth(): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return unauthorizedResponse();
  }

  return user;
}

// Verificar se usuário tem permissão específica
export async function requirePermission(
  permission: Permission
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  // Se é admin legado, tem todas as permissões
  if (user.id === 'admin-legacy' || user.isAdmin) {
    return user;
  }

  // Buscar usuário completo do banco para verificar permissões
  const dbUser = await getUserByEmail(user.email);

  if (!dbUser) {
    return forbiddenResponse('Usuário não encontrado');
  }

  if (!hasPermission(dbUser, permission)) {
    return forbiddenResponse(`Você não tem permissão para: ${permission}`);
  }

  return user;
}

// Verificar se usuário tem todas as permissões
export async function requireAllPermissions(
  permissions: Permission[]
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  // Se é admin legado, tem todas as permissões
  if (user.id === 'admin-legacy' || user.isAdmin) {
    return user;
  }

  const dbUser = await getUserByEmail(user.email);

  if (!dbUser) {
    return forbiddenResponse('Usuário não encontrado');
  }

  if (!hasAllPermissions(dbUser, permissions)) {
    return forbiddenResponse('Permissões insuficientes');
  }

  return user;
}

// Verificar se usuário tem alguma das permissões
export async function requireAnyPermission(
  permissions: Permission[]
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const user = authResult;

  // Se é admin legado, tem todas as permissões
  if (user.id === 'admin-legacy' || user.isAdmin) {
    return user;
  }

  const dbUser = await getUserByEmail(user.email);

  if (!dbUser) {
    return forbiddenResponse('Usuário não encontrado');
  }

  if (!hasAnyPermission(dbUser, permissions)) {
    return forbiddenResponse('Permissões insuficientes');
  }

  return user;
}

// Verificar se usuário é admin
export async function requireAdmin(): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Admin legado ou isAdmin
  if (authResult.id === 'admin-legacy' || authResult.isAdmin) {
    return authResult;
  }

  return forbiddenResponse('Acesso restrito a administradores');
}

// Filtrar dados por accountId do usuário
export function filterByAccount<T extends { accountId?: string }>(
  items: T[],
  user: AuthenticatedUser
): T[] {
  // Admin vê tudo
  if (user.isAdmin || user.id === 'admin-legacy') {
    return items;
  }

  // Se usuário não tem accountId, não vê nada (exceto itens sem accountId)
  if (!user.accountId) {
    return items.filter(item => !item.accountId);
  }

  // Filtrar por accountId do usuário
  return items.filter(item => !item.accountId || item.accountId === user.accountId);
}

// Verificar se usuário pode acessar um terminal específico
export function canAccessTerminal(user: AuthenticatedUser, terminalId: string): boolean {
  if (user.isAdmin || user.id === 'admin-legacy') return true;
  if (!user.allowedTerminals || user.allowedTerminals.length === 0) return true;
  return user.allowedTerminals.includes(terminalId);
}

// Verificar se usuário pode acessar um anunciante específico
export function canAccessAdvertiser(user: AuthenticatedUser, advertiserId: string): boolean {
  if (user.isAdmin || user.id === 'admin-legacy') return true;
  if (!user.allowedAdvertisers || user.allowedAdvertisers.length === 0) return true;
  return user.allowedAdvertisers.includes(advertiserId);
}

// Filtrar terminais que o usuário pode ver
export function filterTerminals<T extends { id: string }>(
  terminals: T[],
  user: AuthenticatedUser
): T[] {
  if (user.isAdmin || user.id === 'admin-legacy') return terminals;
  if (!user.allowedTerminals || user.allowedTerminals.length === 0) return terminals;
  return terminals.filter(t => user.allowedTerminals!.includes(t.id));
}

// Filtrar anunciantes que o usuário pode ver
export function filterAdvertisers<T extends { id: string }>(
  advertisers: T[],
  user: AuthenticatedUser
): T[] {
  if (user.isAdmin || user.id === 'admin-legacy') return advertisers;
  if (!user.allowedAdvertisers || user.allowedAdvertisers.length === 0) return advertisers;
  return advertisers.filter(a => user.allowedAdvertisers!.includes(a.id));
}

// Wrapper para API routes protegidas
export function withAuth(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAuth();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}

// Wrapper para API routes com permissão específica
export function withPermission(
  permission: Permission,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requirePermission(permission);

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}

// Wrapper para API routes de admin
export function withAdmin(
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await requireAdmin();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    return handler(request, authResult);
  };
}
