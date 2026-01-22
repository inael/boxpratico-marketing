import { NextRequest, NextResponse } from 'next/server';
import { getPayment as getMPPayment } from '@/lib/mercadopago';
import { Payment, MercadoPagoWebhook } from '@/types';
import {
  setEntity,
  getAllEntities,
} from '@/lib/redis';

const PAYMENTS_KEY = 'payments';

// POST /api/payments/webhook - Receber notificações do MercadoPago
export async function POST(request: NextRequest) {
  try {
    // Verificar se é notificação do MercadoPago
    const searchParams = request.nextUrl.searchParams;
    const topic = searchParams.get('topic') || searchParams.get('type');
    const id = searchParams.get('id') || searchParams.get('data.id');

    // Corpo da requisição (pode vir vazio ou com dados)
    let body: MercadoPagoWebhook | null = null;
    try {
      body = await request.json();
    } catch {
      // Body pode estar vazio em algumas notificações
    }

    console.log('[Webhook MP] Recebido:', { topic, id, body });

    // Determinar tipo e ID
    const notificationType = topic || body?.type;
    const resourceId = id || body?.data?.id;

    if (!resourceId) {
      console.log('[Webhook MP] ID não encontrado, ignorando');
      return NextResponse.json({ received: true });
    }

    // Processar apenas notificações de pagamento
    if (notificationType === 'payment' || body?.action?.includes('payment')) {
      await processPaymentNotification(resourceId);
    }

    // Sempre retornar 200 para o MercadoPago
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook MP] Erro:', error);
    // Mesmo com erro, retornar 200 para evitar reenvios
    return NextResponse.json({ received: true, error: 'Erro processado' });
  }
}

// GET /api/payments/webhook - MercadoPago pode fazer GET para verificar
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook ativo' });
}

// Processar notificação de pagamento
async function processPaymentNotification(mpPaymentId: string) {
  console.log('[Webhook MP] Processando pagamento:', mpPaymentId);

  try {
    // Buscar dados do pagamento no MercadoPago
    const mpPayment = await getMPPayment(mpPaymentId);

    if (!mpPayment) {
      console.log('[Webhook MP] Pagamento não encontrado no MP:', mpPaymentId);
      return;
    }

    console.log('[Webhook MP] Dados do MP:', mpPayment);

    // Buscar pagamento local pela referência externa
    const payments = await getAllEntities<Payment>(PAYMENTS_KEY);
    const localPayment = payments.find(
      p => p.mpPaymentId === mpPaymentId || p.externalReference === mpPayment.externalReference
    );

    if (!localPayment) {
      console.log('[Webhook MP] Pagamento local não encontrado para:', mpPaymentId);
      return;
    }

    // Atualizar status do pagamento local
    const updatedPayment: Payment = {
      ...localPayment,
      status: mpPayment.status,
      statusDetail: mpPayment.statusDetail,
      paymentMethod: mpPayment.paymentMethod,
      paidAt: mpPayment.paidAt,
      updatedAt: new Date().toISOString(),
    };

    await setEntity(PAYMENTS_KEY, localPayment.id, updatedPayment);

    console.log('[Webhook MP] Pagamento atualizado:', {
      id: localPayment.id,
      status: mpPayment.status,
    });

    // Se aprovado, executar ações pós-pagamento
    if (mpPayment.status === 'approved') {
      await onPaymentApproved(updatedPayment);
    }
  } catch (error) {
    console.error('[Webhook MP] Erro ao processar pagamento:', error);
  }
}

// Ações após pagamento aprovado
async function onPaymentApproved(payment: Payment) {
  console.log('[Webhook MP] Pagamento aprovado:', payment.id);

  // TODO: Implementar ações específicas
  // - Se for assinatura: ativar/renovar conta
  // - Se for campanha: ativar campanha do anunciante
  // - Enviar email de confirmação
  // - Gerar nota fiscal

  // Por enquanto, apenas log
  console.log('[Webhook MP] Ações pós-pagamento pendentes para:', {
    type: payment.type,
    accountId: payment.accountId,
    amount: payment.amount,
  });
}
