import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getUserContexts,
  switchUserContext,
  getActiveUserContext,
  getTenantById,
} from '@/lib/database';
import { getUserMenu, NEW_ROLE_PERMISSIONS, Role } from '@/types';

/**
 * GET /api/auth/switch-context
 * Retorna todos os contextos disponíveis para o usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const userId = session.user.id;
    const contexts = await getUserContexts(userId);

    // Enriquecer com dados do tenant
    const enrichedContexts = await Promise.all(
      contexts.map(async (ctx) => {
        let tenant = null;
        if (ctx.tenantId) {
          const tenantData = await getTenantById(ctx.tenantId);
          if (tenantData) {
            tenant = {
              id: tenantData.id,
              name: tenantData.name,
              logoUrl: tenantData.logoUrl,
            };
          }
        }
        return {
          ...ctx,
          tenant,
        };
      })
    );

    // Encontrar o contexto ativo
    const activeContext = await getActiveUserContext(userId);

    return NextResponse.json({
      contexts: enrichedContexts,
      activeContextId: activeContext?.id || null,
    });
  } catch (error) {
    console.error('[API /auth/switch-context] GET Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contextos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/switch-context
 * Troca o contexto ativo do usuário
 *
 * Body:
 *   - targetRole: Role (obrigatório)
 *   - targetTenantId?: string (opcional, depende do role)
 *
 * Response:
 *   - success: boolean
 *   - activeContext: UserContext atualizado
 *   - menu: array de itens de menu para o novo contexto
 *   - permissions: array de permissões do novo contexto
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const { targetRole, targetTenantId } = body;

    if (!targetRole) {
      return NextResponse.json(
        { error: 'targetRole é obrigatório' },
        { status: 400 }
      );
    }

    // Validar se o role é válido
    const validRoles: Role[] = [
      'SUPER_ADMIN',
      'TENANT_ADMIN',
      'TENANT_MANAGER',
      'LOCATION_OWNER',
      'ADVERTISER',
      'OPERATOR',
    ];

    if (!validRoles.includes(targetRole)) {
      return NextResponse.json(
        { error: 'Role inválido' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Tentar trocar o contexto
    const newContext = await switchUserContext(userId, targetRole, targetTenantId);

    if (!newContext) {
      return NextResponse.json(
        {
          error: 'Você não possui acesso a este contexto',
          details: `Role: ${targetRole}, TenantId: ${targetTenantId || 'null'}`,
        },
        { status: 403 }
      );
    }

    // Buscar dados do tenant (se houver)
    let tenant = null;
    if (newContext.tenantId) {
      const tenantData = await getTenantById(newContext.tenantId);
      if (tenantData) {
        tenant = {
          id: tenantData.id,
          name: tenantData.name,
          type: tenantData.type,
          logoUrl: tenantData.logoUrl,
          primaryColor: tenantData.primaryColor,
        };
      }
    }

    // Obter menu e permissões para o novo contexto
    const role = newContext.role as Role;
    const permissions = NEW_ROLE_PERMISSIONS[role] || [];

    // Construir usuário simulado para gerar menu
    const userForMenu = {
      id: userId,
      name: session.user.name,
      email: session.user.email,
      role: role,
      tenantId: newContext.tenantId,
    };

    const menu = getUserMenu(userForMenu as any, tenant as any);

    console.log(
      `[Context Switch] User ${session.user.email} switched to ${targetRole}${
        targetTenantId ? ` (tenant: ${targetTenantId})` : ''
      }`
    );

    return NextResponse.json({
      success: true,
      activeContext: {
        ...newContext,
        tenant,
      },
      menu,
      permissions,
    });
  } catch (error) {
    console.error('[API /auth/switch-context] POST Error:', error);
    return NextResponse.json(
      { error: 'Erro ao trocar contexto' },
      { status: 500 }
    );
  }
}
