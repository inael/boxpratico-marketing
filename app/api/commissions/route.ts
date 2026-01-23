import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getCommissionLedgerEntries,
  getSalesAgents,
  getSalesAgentById,
  getContractById,
  getInvoiceById,
} from '@/lib/database';

/**
 * GET /api/commissions
 * Lista comissões com filtros
 * Query params:
 *   - tenantId: string (obrigatório para não-super-admin)
 *   - salesAgentId: string (opcional)
 *   - startMonth: string YYYY-MM (opcional)
 *   - endMonth: string YYYY-MM (opcional)
 *   - status: 'PENDING' | 'PAID' | 'CANCELLED' (opcional)
 *   - summary: boolean (opcional, retorna resumo agregado)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tenantId = searchParams.get('tenantId') || session.user.tenantId;
    const salesAgentId = searchParams.get('salesAgentId');
    const startMonth = searchParams.get('startMonth');
    const endMonth = searchParams.get('endMonth');
    const status = searchParams.get('status') as 'PENDING' | 'PAID' | 'CANCELLED' | null;
    const summary = searchParams.get('summary') === 'true';

    // Buscar todas as entradas
    let entries = await getCommissionLedgerEntries(tenantId || undefined);

    // Aplicar filtros
    if (salesAgentId) {
      entries = entries.filter((e) => e.salesAgentId === salesAgentId);
    }

    if (status) {
      entries = entries.filter((e) => e.status === status);
    }

    if (startMonth) {
      entries = entries.filter((e) => e.referenceMonth >= startMonth);
    }

    if (endMonth) {
      entries = entries.filter((e) => e.referenceMonth <= endMonth);
    }

    // Enriquecer com dados relacionados
    const enrichedEntries = await Promise.all(
      entries.map(async (entry) => {
        const [salesAgent, contract, invoice] = await Promise.all([
          getSalesAgentById(entry.salesAgentId),
          getContractById(entry.contractId),
          getInvoiceById(entry.invoiceId),
        ]);

        return {
          ...entry,
          salesAgent: salesAgent
            ? { id: salesAgent.id, name: salesAgent.name }
            : undefined,
          contract: contract
            ? { id: contract.id, partyAName: contract.partyAName, partyBName: contract.partyBName }
            : undefined,
          invoice: invoice
            ? { id: invoice.id, invoiceNumber: invoice.invoiceNumber, amount: invoice.amount }
            : undefined,
        };
      })
    );

    // Se solicitado resumo, agregar por vendedor
    if (summary) {
      const agents = await getSalesAgents(tenantId || undefined);
      const byAgent: Array<{
        salesAgentId: string;
        salesAgentName: string;
        period: string;
        totalPending: number;
        totalPaid: number;
        totalCancelled: number;
        pendingCount: number;
        paidCount: number;
        entries: typeof enrichedEntries;
      }> = [];

      for (const agent of agents) {
        const agentEntries = enrichedEntries.filter(
          (e) => e.salesAgentId === agent.id
        );

        if (agentEntries.length === 0) continue;

        const pending = agentEntries.filter((e) => e.status === 'PENDING');
        const paid = agentEntries.filter((e) => e.status === 'PAID');
        const cancelled = agentEntries.filter((e) => e.status === 'CANCELLED');

        byAgent.push({
          salesAgentId: agent.id,
          salesAgentName: agent.name,
          period: startMonth && endMonth ? `${startMonth} a ${endMonth}` : 'Todos',
          totalPending: pending.reduce((sum, e) => sum + e.amount, 0),
          totalPaid: paid.reduce((sum, e) => sum + e.amount, 0),
          totalCancelled: cancelled.reduce((sum, e) => sum + e.amount, 0),
          pendingCount: pending.length,
          paidCount: paid.length,
          entries: agentEntries,
        });
      }

      const summaryResponse = {
        filters: {
          tenantId: tenantId || '',
          salesAgentId: salesAgentId || undefined,
          startMonth: startMonth || undefined,
          endMonth: endMonth || undefined,
          status: status || undefined,
        },
        totalPending: enrichedEntries
          .filter((e) => e.status === 'PENDING')
          .reduce((sum, e) => sum + e.amount, 0),
        totalPaid: enrichedEntries
          .filter((e) => e.status === 'PAID')
          .reduce((sum, e) => sum + e.amount, 0),
        totalCancelled: enrichedEntries
          .filter((e) => e.status === 'CANCELLED')
          .reduce((sum, e) => sum + e.amount, 0),
        grandTotal: enrichedEntries.reduce((sum, e) => sum + e.amount, 0),
        entriesCount: enrichedEntries.length,
        byAgent,
      };

      return NextResponse.json(summaryResponse);
    }

    // Ordenar por data (mais recentes primeiro)
    enrichedEntries.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(enrichedEntries);
  } catch (error) {
    console.error('[API /commissions] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comissões' },
      { status: 500 }
    );
  }
}
