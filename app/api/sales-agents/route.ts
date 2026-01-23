import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getSalesAgents,
  getSalesAgentByEmail,
  createSalesAgent,
  getCommissionLedgerBySalesAgent,
  getContracts,
} from '@/lib/database';
import { validateCommissionRate } from '@/types';

/**
 * GET /api/sales-agents
 * Lista todos os vendedores do tenant
 * Query params:
 *   - tenantId: string (opcional, filtro por tenant)
 *   - includeStats: boolean (opcional, incluir estatísticas)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const includeStats = searchParams.get('includeStats') === 'true';

    // Buscar vendedores
    let agents = await getSalesAgents(tenantId || undefined);

    // Se solicitado, incluir estatísticas
    if (includeStats) {
      const contracts = await getContracts();

      agents = await Promise.all(
        agents.map(async (agent) => {
          const agentContracts = contracts.filter(
            (c: any) => c.salesAgentId === agent.id
          );
          const commissions = await getCommissionLedgerBySalesAgent(agent.id);

          const pendingCommissions = commissions
            .filter((c) => c.status === 'PENDING')
            .reduce((sum, c) => sum + c.amount, 0);

          const paidCommissions = commissions
            .filter((c) => c.status === 'PAID')
            .reduce((sum, c) => sum + c.amount, 0);

          return {
            ...agent,
            totalContracts: agentContracts.length,
            activeContracts: agentContracts.filter(
              (c: any) => c.status === 'active' || c.status === 'ACTIVE'
            ).length,
            totalCommissionsPending: pendingCommissions,
            totalCommissionsPaid: paidCommissions,
          };
        })
      );
    }

    return NextResponse.json(agents);
  } catch (error) {
    console.error('[API /sales-agents] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vendedores' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sales-agents
 * Cria um novo vendedor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissão (apenas admins podem criar vendedores)
    if (!session.user.isAdmin && session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const {
      tenantId: bodyTenantId,
      name,
      email,
      phone,
      document,
      defaultCommissionRate,
      paymentDetails,
      isActive,
    } = body;

    // Validações
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome é obrigatório (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    const tenantId = bodyTenantId || session.user.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'TenantId é obrigatório' },
        { status: 400 }
      );
    }

    // Validar taxa de comissão
    const rate = defaultCommissionRate ?? 30;
    const rateValidation = validateCommissionRate(rate);
    if (!rateValidation.valid) {
      return NextResponse.json({ error: rateValidation.error }, { status: 400 });
    }

    // Verificar email único no tenant
    if (email) {
      const existing = await getSalesAgentByEmail(tenantId, email);
      if (existing) {
        return NextResponse.json(
          { error: 'Já existe um vendedor com este email neste tenant' },
          { status: 409 }
        );
      }
    }

    // Criar vendedor
    const agent = await createSalesAgent({
      tenantId,
      name: name.trim(),
      email: email?.trim() || undefined,
      phone: phone?.trim() || undefined,
      document: document?.trim() || undefined,
      defaultCommissionRate: rate,
      paymentDetails: paymentDetails || undefined,
      isActive: isActive !== false,
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error('[API /sales-agents] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar vendedor' },
      { status: 500 }
    );
  }
}
