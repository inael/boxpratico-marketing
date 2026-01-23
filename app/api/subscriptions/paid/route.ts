import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  processAffiliateSaaSPayment,
  getTenantById,
  getUserById,
} from '@/lib/database';

/**
 * POST /api/subscriptions/paid
 * Processa o pagamento de uma assinatura SaaS e gera comissões de afiliados
 *
 * Este endpoint implementa o "gatilho de pagamento" (Payment Trigger) para afiliados:
 * Quando uma fatura de assinatura SaaS é paga, o sistema automaticamente:
 * 1. Carrega as configurações atuais de affiliate_l1_percentage e affiliate_l2_percentage
 * 2. Identifica o Nível 1 (Pai) - quem indicou o tenant
 * 3. Calcula: Invoice.total * (l1_percentage / 100)
 * 4. Identifica o Nível 2 (Avô) - quem indicou o "Pai"
 * 5. Calcula: Invoice.total * (l2_percentage / 100)
 * 6. TRAVA DE SEGURANÇA: Para no Nível 2, não calcula Nível 3
 *
 * Body:
 *   - tenantId: string (obrigatório)
 *   - invoiceId: string (obrigatório)
 *   - invoiceAmount: number (obrigatório)
 *   - referenceMonth?: string (YYYY-MM, default: mês atual)
 *
 * Este endpoint pode ser chamado por:
 * - Webhook de pagamento (MercadoPago, Stripe, etc)
 * - Admin marcando manualmente uma fatura como paga
 * - Sistema de cobrança automática
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (pode ser via API key para webhooks)
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.WEBHOOK_API_KEY;

    let isAuthenticated = false;

    // Verificar via API key (para webhooks)
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      isAuthenticated = true;
    }

    // Ou verificar via sessão (para admin)
    if (!isAuthenticated) {
      const session = await getServerSession(authOptions);
      if (session?.user?.isAdmin || session?.user?.role === 'SUPER_ADMIN') {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantId, invoiceId, invoiceAmount, referenceMonth } = body;

    // Validações
    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId é obrigatório' },
        { status: 400 }
      );
    }

    if (!invoiceId) {
      return NextResponse.json(
        { error: 'invoiceId é obrigatório' },
        { status: 400 }
      );
    }

    if (!invoiceAmount || invoiceAmount <= 0) {
      return NextResponse.json(
        { error: 'invoiceAmount deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Buscar tenant para obter o userId do proprietário
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      );
    }

    // Determinar o userId do proprietário do tenant
    // (normalmente é o primeiro usuário TENANT_ADMIN do tenant)
    // Por simplicidade, usamos o referrerId do tenant que aponta para quem indicou
    // Mas precisamos do userId do proprietário do tenant para verificar a cadeia

    // O tenant.referrerId já aponta para quem indicou o tenant
    // Mas precisamos do userId do DONO do tenant
    // Vamos assumir que o body pode incluir opcionalmente userId
    // Ou buscamos via alguma relação

    // Por segurança, vamos exigir o userId no body ou buscar
    let { userId } = body;

    if (!userId) {
      // Tentar buscar o primeiro admin do tenant
      // Por simplicidade, assumimos que o body deve incluir userId
      return NextResponse.json(
        { error: 'userId é obrigatório (proprietário do tenant)' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Determinar mês de referência
    const refMonth =
      referenceMonth || new Date().toISOString().slice(0, 7); // YYYY-MM

    // Processar comissões de afiliados
    const entries = await processAffiliateSaaSPayment(
      tenantId,
      userId,
      invoiceId,
      invoiceAmount,
      refMonth
    );

    console.log(
      `[Affiliate Payment] Processed invoice ${invoiceId} for tenant ${tenantId}:`,
      `${entries.length} commission entries created`
    );

    // Retornar resultado
    return NextResponse.json({
      success: true,
      invoiceId,
      tenantId,
      invoiceAmount,
      commissionsCreated: entries.length,
      commissions: entries.map((e) => ({
        id: e.id,
        tier: e.tier,
        affiliateId: e.affiliateId,
        amount: e.amount,
        percentageApplied: e.percentageApplied,
        status: e.status,
        availableAt: e.availableAt,
      })),
    });
  } catch (error) {
    console.error('[API /subscriptions/paid] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
