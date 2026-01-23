import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCommissionLedgerEntryById,
  updateCommissionLedgerEntry,
  markCommissionAsPaid,
  getSalesAgentById,
  getContractById,
  getInvoiceById,
} from '@/lib/database';

/**
 * GET /api/commissions/[id]
 * Busca uma comissão específica
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
    const entry = await getCommissionLedgerEntryById(id);

    if (!entry) {
      return NextResponse.json(
        { error: 'Comissão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.tenantId &&
      entry.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Enriquecer com dados relacionados
    const [salesAgent, contract, invoice] = await Promise.all([
      getSalesAgentById(entry.salesAgentId),
      getContractById(entry.contractId),
      getInvoiceById(entry.invoiceId),
    ]);

    return NextResponse.json({
      ...entry,
      salesAgent,
      contract,
      invoice,
    });
  } catch (error) {
    console.error('[API /commissions/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comissão' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/commissions/[id]
 * Atualiza uma comissão (ex: marcar como paga)
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
    const existing = await getCommissionLedgerEntryById(id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Comissão não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão de tenant
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.tenantId &&
      existing.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    // Validar transições de status
    if (status) {
      if (existing.status === 'PAID' && status !== 'PAID') {
        return NextResponse.json(
          { error: 'Não é possível alterar status de comissão já paga' },
          { status: 400 }
        );
      }

      if (existing.status === 'CANCELLED' && status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Não é possível alterar status de comissão cancelada' },
          { status: 400 }
        );
      }
    }

    // Se marcando como paga, usar função específica
    if (status === 'PAID' && existing.status !== 'PAID') {
      const entry = await markCommissionAsPaid(
        id,
        session.user.id || session.user.email || 'system'
      );
      return NextResponse.json(entry);
    }

    // Atualização genérica
    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;

    const entry = await updateCommissionLedgerEntry(id, updates);

    return NextResponse.json(entry);
  } catch (error) {
    console.error('[API /commissions/[id]] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar comissão' },
      { status: 500 }
    );
  }
}
