import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getSalesAgentById,
  getSalesAgentByEmail,
  updateSalesAgent,
  deleteSalesAgent,
  getCommissionLedgerBySalesAgent,
  getContracts,
} from '@/lib/database';
import { validateCommissionRate } from '@/types';

/**
 * GET /api/sales-agents/[id]
 * Busca um vendedor específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const agent = await getSalesAgentById(id);

    if (!agent) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pertence ao tenant do usuário (exceto super admin)
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.tenantId &&
      agent.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Incluir estatísticas
    const searchParams = request.nextUrl.searchParams;
    const includeStats = searchParams.get('includeStats') === 'true';

    if (includeStats) {
      const contracts = await getContracts();
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

      return NextResponse.json({
        ...agent,
        totalContracts: agentContracts.length,
        activeContracts: agentContracts.filter(
          (c: any) => c.status === 'active' || c.status === 'ACTIVE'
        ).length,
        totalCommissionsPending: pendingCommissions,
        totalCommissionsPaid: paidCommissions,
        commissions,
      });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error('[API /sales-agents/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar vendedor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sales-agents/[id]
 * Atualiza um vendedor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissão
    if (!session.user.isAdmin && session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getSalesAgentById(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pertence ao tenant do usuário
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.tenantId &&
      existing.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      document,
      defaultCommissionRate,
      paymentDetails,
      isActive,
    } = body;

    // Validações
    if (name !== undefined && name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome deve ter no mínimo 2 caracteres' },
        { status: 400 }
      );
    }

    // Validar taxa de comissão se informada
    if (defaultCommissionRate !== undefined) {
      const rateValidation = validateCommissionRate(defaultCommissionRate);
      if (!rateValidation.valid) {
        return NextResponse.json({ error: rateValidation.error }, { status: 400 });
      }
    }

    // Verificar email único no tenant (se alterado)
    if (email && email !== existing.email) {
      const existingWithEmail = await getSalesAgentByEmail(
        existing.tenantId,
        email
      );
      if (existingWithEmail && existingWithEmail.id !== id) {
        return NextResponse.json(
          { error: 'Já existe um vendedor com este email neste tenant' },
          { status: 409 }
        );
      }
    }

    // Atualizar
    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email?.trim() || undefined;
    if (phone !== undefined) updates.phone = phone?.trim() || undefined;
    if (document !== undefined) updates.document = document?.trim() || undefined;
    if (defaultCommissionRate !== undefined) updates.defaultCommissionRate = defaultCommissionRate;
    if (paymentDetails !== undefined) updates.paymentDetails = paymentDetails;
    if (isActive !== undefined) updates.isActive = isActive;

    const agent = await updateSalesAgent(id, updates);

    return NextResponse.json(agent);
  } catch (error) {
    console.error('[API /sales-agents/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar vendedor' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sales-agents/[id]
 * Remove um vendedor (soft delete recomendado via isActive = false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissão
    if (!session.user.isAdmin && session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await getSalesAgentById(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se pertence ao tenant do usuário
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.tenantId &&
      existing.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se tem contratos ativos
    const contracts = await getContracts();
    const activeContracts = contracts.filter(
      (c: any) =>
        c.salesAgentId === id &&
        (c.status === 'active' || c.status === 'ACTIVE')
    );

    if (activeContracts.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir vendedor com ${activeContracts.length} contrato(s) ativo(s). Desative-o em vez de excluir.`,
        },
        { status: 400 }
      );
    }

    // Verificar se tem comissões pendentes
    const commissions = await getCommissionLedgerBySalesAgent(id);
    const pendingCommissions = commissions.filter((c) => c.status === 'PENDING');

    if (pendingCommissions.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir vendedor com ${pendingCommissions.length} comissão(ões) pendente(s). Pague ou cancele as comissões primeiro.`,
        },
        { status: 400 }
      );
    }

    const success = await deleteSalesAgent(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Erro ao excluir vendedor' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /sales-agents/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir vendedor' },
      { status: 500 }
    );
  }
}
