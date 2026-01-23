import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCommissionLedgerEntryById,
  markCommissionAsPaid,
  updateCommissionLedgerEntry,
} from '@/lib/database';

/**
 * POST /api/commissions/batch
 * Operações em lote nas comissões
 * Body:
 *   - action: 'mark_paid' | 'cancel'
 *   - ids: string[] (IDs das comissões)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissão
    if (!session.user.isAdmin && session.user.role !== 'TENANT_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!action || !['mark_paid', 'cancel'].includes(action)) {
      return NextResponse.json(
        { error: 'Ação inválida. Use "mark_paid" ou "cancel"' },
        { status: 400 }
      );
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs das comissões são obrigatórios' },
        { status: 400 }
      );
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: 'Máximo de 100 comissões por operação' },
        { status: 400 }
      );
    }

    const results: {
      id: string;
      success: boolean;
      error?: string;
    }[] = [];

    const paidBy = session.user.id || session.user.email || 'system';

    for (const id of ids) {
      try {
        const entry = await getCommissionLedgerEntryById(id);

        if (!entry) {
          results.push({ id, success: false, error: 'Não encontrada' });
          continue;
        }

        // Verificar permissão de tenant
        if (
          session.user.role !== 'SUPER_ADMIN' &&
          session.user.tenantId &&
          entry.tenantId !== session.user.tenantId
        ) {
          results.push({ id, success: false, error: 'Sem permissão' });
          continue;
        }

        // Verificar status atual
        if (entry.status !== 'PENDING') {
          results.push({
            id,
            success: false,
            error: `Status atual: ${entry.status}. Apenas comissões pendentes podem ser alteradas`,
          });
          continue;
        }

        if (action === 'mark_paid') {
          await markCommissionAsPaid(id, paidBy);
          results.push({ id, success: true });
        } else if (action === 'cancel') {
          await updateCommissionLedgerEntry(id, { status: 'CANCELLED' });
          results.push({ id, success: true });
        }
      } catch (error) {
        results.push({ id, success: false, error: 'Erro ao processar' });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failCount === 0,
      processed: results.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('[API /commissions/batch] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar comissões em lote' },
      { status: 500 }
    );
  }
}
