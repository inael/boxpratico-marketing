import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserByEmail, getTenantById } from '@/lib/database';
import {
  Role,
  TenantType,
  getUserMenu,
  FEATURE_TOGGLES,
  NEW_ROLE_PERMISSIONS,
  UserMenuResponse,
  Tenant,
} from '@/types';

/**
 * GET /api/me/menu
 *
 * Retorna o menu dinâmico baseado no perfil do usuário.
 * O menu varia de acordo com:
 * - Role do usuário (SUPER_ADMIN, TENANT_ADMIN, etc.)
 * - Tipo do tenant (COMMERCIAL ou CORPORATE)
 *
 * Exemplo de resposta:
 * {
 *   user: { id, name, email, role, avatarUrl },
 *   tenant: { id, name, type, logoUrl, primaryColor } | null,
 *   menu: [ { id, label, items: [...] } ],
 *   permissions: ['locations:read', 'screens:create', ...],
 *   features: { advertisers: true, mural: false, ... }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar dados completos do usuário
    const user = await getUserByEmail(session.user.email);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Usuário inativo' },
        { status: 403 }
      );
    }

    // Determinar o role do usuário
    const role = (user.role as Role) || 'OPERATOR';

    // Buscar tenant (se não for SUPER_ADMIN)
    let tenant: Tenant | null = null;
    if (role !== 'SUPER_ADMIN' && user.tenantId) {
      tenant = await getTenantById(user.tenantId);
    }

    // Determinar tipo do tenant
    const tenantType: TenantType = tenant?.type || 'COMMERCIAL';

    // Obter menu baseado no role e tipo do tenant
    const menu = getUserMenu(user as any, tenant);

    // Obter permissões do role
    const permissions = NEW_ROLE_PERMISSIONS[role] || [];

    // Obter features habilitadas para o tipo de tenant
    const features = FEATURE_TOGGLES[tenantType] || FEATURE_TOGGLES.COMMERCIAL;

    // Montar resposta
    const response: UserMenuResponse = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role,
        avatarUrl: user.avatarUrl,
      },
      tenant: tenant ? {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        logoUrl: tenant.logoUrl,
        primaryColor: tenant.primaryColor,
      } : null,
      menu,
      permissions,
      features,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[API /me/menu] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
