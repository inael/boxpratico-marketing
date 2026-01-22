import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  createPixPayment,
  createPreference,
  getCallbackUrls,
  isMercadoPagoConfigured,
  calculateOperatorPrice,
} from '@/lib/mercadopago';
import { requireAuth, AuthenticatedUser } from '@/lib/auth-utils';
import { Payment } from '@/types';
import {
  setEntity,
  getEntity,
  getAllEntities,
} from '@/lib/redis';

const PAYMENTS_KEY = 'payments';

// GET /api/payments - Listar pagamentos do usuário
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    // Buscar todos os pagamentos
    let payments = await getAllEntities<Payment>(PAYMENTS_KEY);

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
    console.error('Failed to fetch payments:', error);
    return NextResponse.json({ error: 'Erro ao buscar pagamentos' }, { status: 500 });
  }
}

// POST /api/payments - Criar novo pagamento
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const currentUser = authResult as AuthenticatedUser;

    if (!isMercadoPagoConfigured()) {
      return NextResponse.json(
        { error: 'Sistema de pagamentos não configurado' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      type,           // 'subscription' | 'one_time' | 'advertiser_campaign'
      paymentMethod,  // 'pix' | 'credit_card' | 'boleto' | 'checkout'
      amount,         // Valor (se não for calculado automaticamente)
      monitorCount,   // Para assinaturas de operador
      description,
      accountId: bodyAccountId,
    } = body;

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

    // Criar ID do pagamento
    const paymentId = uuidv4();
    const externalReference = `${accountId}:${paymentId}`;

    // Pegar email do pagador
    const payerEmail = currentUser.email || 'cliente@boxpratico.com.br';

    // Base URL para callbacks
    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'http://localhost:3000';

    let paymentResult: Payment = {
      id: paymentId,
      accountId,
      userId: currentUser.id,
      type: type || 'one_time',
      amount: finalAmount,
      currency: 'BRL',
      status: 'pending',
      description: finalDescription || 'Pagamento BoxPratico',
      externalReference,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Criar pagamento de acordo com o método
    if (paymentMethod === 'pix') {
      const pixResult = await createPixPayment({
        amount: finalAmount,
        description: finalDescription || 'Pagamento BoxPratico',
        externalReference,
        payerEmail,
      });

      if (!pixResult.success) {
        return NextResponse.json(
          { error: pixResult.error || 'Erro ao criar PIX' },
          { status: 500 }
        );
      }

      paymentResult = {
        ...paymentResult,
        paymentMethod: 'pix',
        mpPaymentId: pixResult.mpPaymentId,
        pixQrCode: pixResult.qrCode,
        pixQrCodeBase64: pixResult.qrCodeBase64,
        pixCopiaECola: pixResult.copiaECola,
        pixExpiresAt: pixResult.expiresAt,
      };
    } else if (paymentMethod === 'checkout') {
      // Usar Checkout Pro (cartão, boleto, PIX)
      const callbacks = getCallbackUrls(baseUrl);

      const prefResult = await createPreference({
        items: [{
          title: finalDescription || 'Pagamento BoxPratico',
          quantity: 1,
          unitPrice: finalAmount,
        }],
        externalReference,
        payerEmail,
        backUrls: {
          success: callbacks.success,
          failure: callbacks.failure,
          pending: callbacks.pending,
        },
        autoReturn: 'approved',
        notificationUrl: callbacks.notification,
      });

      if (!prefResult.success) {
        return NextResponse.json(
          { error: prefResult.error || 'Erro ao criar checkout' },
          { status: 500 }
        );
      }

      paymentResult = {
        ...paymentResult,
        mpPreferenceId: prefResult.preferenceId,
      };

      // Salvar pagamento
      await setEntity(PAYMENTS_KEY, paymentId, paymentResult);

      // Retornar URL do checkout
      return NextResponse.json({
        success: true,
        payment: paymentResult,
        checkoutUrl: process.env.NODE_ENV === 'production'
          ? prefResult.initPoint
          : prefResult.sandboxInitPoint,
      });
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento inválido. Use: pix ou checkout' },
        { status: 400 }
      );
    }

    // Salvar pagamento
    await setEntity(PAYMENTS_KEY, paymentId, paymentResult);

    return NextResponse.json({
      success: true,
      payment: paymentResult,
    });
  } catch (error) {
    console.error('Failed to create payment:', error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}
