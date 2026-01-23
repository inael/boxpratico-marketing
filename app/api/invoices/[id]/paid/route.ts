import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getInvoiceById,
  updateInvoice,
  getContractById,
  getSalesAgentById,
  processInvoicePayment,
} from '@/lib/database';

/**
 * POST /api/invoices/[id]/paid
 * Marca uma fatura como paga e processa a comissão do vendedor
 *
 * Este endpoint implementa o "gatilho de pagamento" (Payment Trigger):
 * Quando uma fatura é marcada como paga, o sistema automaticamente:
 * 1. Atualiza o status da fatura para PAID
 * 2. Verifica se o contrato tem vendedor vinculado
 * 3. Calcula a comissão usando o snapshot de taxa do contrato
 * 4. Cria uma entrada no CommissionLedger com status PENDING
 *
 * Body:
 *   - paidAmount?: number (valor pago, default = valor da fatura)
 *   - paymentMethod?: string
 *   - externalId?: string (ID do pagamento externo, ex: MercadoPago)
 */
export async function POST(
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
    const invoice = await getInvoiceById(id);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Fatura não encontrada' },
        { status: 404 }
      );
    }

    // Verificar permissão de tenant
    if (
      session.user.role !== 'SUPER_ADMIN' &&
      session.user.tenantId &&
      invoice.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Verificar se já está paga
    if (invoice.status === 'approved') {
      return NextResponse.json(
        { error: 'Fatura já está paga' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { paidAmount, paymentMethod, externalId } = body;

    // Atualizar fatura para APPROVED (paga)
    const updatedInvoice = await updateInvoice(id, {
      status: 'approved',
      paidAt: new Date().toISOString(),
      paidAmount: paidAmount || invoice.amount,
      paymentMethod: paymentMethod || undefined,
      externalId: externalId || undefined,
    });

    // Buscar contrato para verificar se tem vendedor
    const contract = await getContractById(invoice.contractId);

    let commissionEntry = null;

    if (contract) {
      // Verificar se contrato tem vendedor vinculado
      const salesAgentId = (contract as any).salesAgentId;

      if (salesAgentId) {
        // Verificar se vendedor existe e está ativo
        const salesAgent = await getSalesAgentById(salesAgentId);

        if (salesAgent) {
          // REGRA DE INATIVAÇÃO:
          // Mesmo que o vendedor esteja inativo, a comissão é gerada
          // porque foi contratada quando ele estava ativo
          commissionEntry = await processInvoicePayment(
            id,
            invoice.contractId,
            salesAgentId
          );

          if (commissionEntry) {
            console.log(
              `[Invoice Paid] Comissão gerada: R$ ${commissionEntry.amount} para ${salesAgent.name}`
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      commission: commissionEntry
        ? {
            id: commissionEntry.id,
            amount: commissionEntry.amount,
            rate: commissionEntry.rate,
            status: commissionEntry.status,
          }
        : null,
    });
  } catch (error) {
    console.error('[API /invoices/[id]/paid] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
