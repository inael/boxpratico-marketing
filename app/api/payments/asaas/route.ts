import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createSimplePayment,
  getPayment as getAsaasPayment,
  isAsaasConfigured,
  calculateOperatorPrice,
  isValidCpfCnpj,
  AsaasBillingType,
} from '@/lib/asaas';
import { requireAuth, AuthenticatedUser } from '@/lib/auth-utils';
import { Payment } from '@/types';
import { setEntity, getEntity, getAllEntities } from '@/lib/redis';

const PAYMENTS_KEY = 'payments';

/**
 * GET /api/payments/asaas
 * Listar pagamentos feitos via Asaas
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const asaasPaymentId = searchParams.get('asaasPaymentId');

    // Se buscar por ID específico do Asaas
    if (asaasPaymentId) {
      const asaasPayment = await getAsaasPayment(asaasPaymentId);
      if (!asaasPayment) {
        return NextResponse.json({ error: 'Pagamento não encontrado' }, { status: 404 });
      }
      return NextResponse.json(asaasPayment);
    }

    // Buscar todos os pagamentos
    let payments = await getAllEntities<Payment>(PAYMENTS_KEY);

    // Filtrar apenas pagamentos Asaas
    payments = payments.filter(p => p.paymentProvider === 'asaas');

    // Filtrar por conta
    if (currentUser.isAdmin && accountId) {
      payments = payments.filter(p => p.accountId === accountId);
    } else if (!currentUser.isAdmin) {
      payments = payments.filter(p => p.accountId === currentUser.accountId);
    }

    // Ordenar por data (mais recente primeiro)
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(payments);
  } catch (error) {
    console.error('[Asaas API] GET Error:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

/**
 * POST /api/payments/asaas
 * Criar novo pagamento via Asaas
 *
 * Body:
 *   - type: 'subscription' | 'one_time' | 'advertiser_campaign'
 *   - billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD'
 *   - amount?: number (se não informado, calcula por monitorCount)
 *   - monitorCount?: number (para assinaturas de operador)
 *   - description?: string
 *   - customerName: string (obrigatório)
 *   - customerCpfCnpj: string (obrigatório)
 *   - customerEmail?: string
 *   - customerPhone?: string
 *   - accountId?: string (apenas admin)
 *   - dueDate?: string (YYYY-MM-DD, default: hoje)
 *   - installmentCount?: number (para parcelamento)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    if (!isAsaasConfigured()) {
      return NextResponse.json(
        { error: 'Asaas não configurado. Verifique as variáveis de ambiente.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      type = 'one_time',
      billingType = 'PIX',
      amount,
      monitorCount,
      description,
      customerName,
      customerCpfCnpj,
      customerEmail,
      customerPhone,
      accountId: bodyAccountId,
      dueDate,
      installmentCount,
    } = body;

    // Validações
    if (!customerName) {
      return NextResponse.json(
        { error: 'Nome do cliente é obrigatório' },
        { status: 400 }
      );
    }

    if (!customerCpfCnpj) {
      return NextResponse.json(
        { error: 'CPF/CNPJ do cliente é obrigatório' },
        { status: 400 }
      );
    }

    if (!isValidCpfCnpj(customerCpfCnpj)) {
      return NextResponse.json(
        { error: 'CPF/CNPJ inválido' },
        { status: 400 }
      );
    }

    const validBillingTypes: AsaasBillingType[] = ['PIX', 'BOLETO', 'CREDIT_CARD'];
    if (!validBillingTypes.includes(billingType)) {
      return NextResponse.json(
        { error: 'Tipo de cobrança inválido. Use: PIX, BOLETO ou CREDIT_CARD' },
        { status: 400 }
      );
    }

    // Determinar accountId
    const accountId = currentUser.isAdmin && bodyAccountId
      ? bodyAccountId
      : currentUser.accountId;

    if (!accountId) {
      return NextResponse.json(
        { error: 'Conta não encontrada' },
        { status: 400 }
      );
    }

    // Calcular valor se for assinatura de operador
    let finalAmount = amount;
    let finalDescription = description;

    if (type === 'subscription' && monitorCount) {
      const pricing = calculateOperatorPrice(monitorCount);
      finalAmount = pricing.amount;
      finalDescription = pricing.description;
    }

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valor inválido' },
        { status: 400 }
      );
    }

    // Criar ID do pagamento interno
    const paymentId = uuidv4();
    const externalReference = `${accountId}:${paymentId}`;

    // Criar pagamento no Asaas
    const asaasResult = await createSimplePayment({
      customerName,
      customerCpfCnpj,
      customerEmail: customerEmail || currentUser.email,
      customerPhone,
      amount: finalAmount,
      description: finalDescription || 'Pagamento BoxPratico',
      billingType: billingType as AsaasBillingType,
      externalReference,
      dueDate,
      installmentCount,
    });

    if (!asaasResult.success) {
      console.error('[Asaas API] Erro ao criar pagamento:', asaasResult.error);
      return NextResponse.json(
        { error: asaasResult.error || 'Erro ao criar pagamento no Asaas' },
        { status: 500 }
      );
    }

    // Mapear para nosso formato de Payment
    const payment: Payment = {
      id: paymentId,
      accountId,
      userId: currentUser.id,
      type: type as Payment['type'],
      amount: finalAmount,
      currency: 'BRL',
      status: asaasResult.status || 'pending',
      description: finalDescription || 'Pagamento BoxPratico',
      externalReference,
      paymentProvider: 'asaas',
      asaasPaymentId: asaasResult.paymentId,
      asaasCustomerId: asaasResult.customerId,
      asaasInvoiceUrl: asaasResult.invoiceUrl,
      paymentMethod: asaasResult.billingType,
      // PIX
      pixQrCodeBase64: asaasResult.pixQrCodeBase64,
      pixCopiaECola: asaasResult.pixCopiaECola,
      pixExpiresAt: asaasResult.pixExpirationDate,
      // Boleto
      boletoUrl: asaasResult.boletoUrl,
      // Datas
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Salvar pagamento
    await setEntity(PAYMENTS_KEY, paymentId, payment);

    console.log(`[Asaas API] Pagamento criado: ${paymentId} (Asaas: ${asaasResult.paymentId})`);

    return NextResponse.json({
      success: true,
      payment,
      // Dados extras para o frontend
      invoiceUrl: asaasResult.invoiceUrl,
      pixQrCodeBase64: asaasResult.pixQrCodeBase64,
      pixCopiaECola: asaasResult.pixCopiaECola,
      boletoUrl: asaasResult.boletoUrl,
    });
  } catch (error) {
    console.error('[Asaas API] POST Error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
