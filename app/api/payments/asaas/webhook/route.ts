import { NextRequest, NextResponse } from 'next/server';
import {
  processWebhook,
  getPayment as getAsaasPayment,
  AsaasWebhookPayload,
} from '@/lib/asaas';
import { Payment } from '@/types';
import { setEntity, getAllEntities } from '@/lib/redis';
import { processAffiliateSaaSPayment } from '@/lib/database';

const PAYMENTS_KEY = 'payments';

/**
 * POST /api/payments/asaas/webhook
 * Receber notificações do Asaas
 *
 * Eventos principais:
 * - PAYMENT_RECEIVED: Pagamento recebido (aprovado)
 * - PAYMENT_CONFIRMED: Pagamento confirmado
 * - PAYMENT_OVERDUE: Pagamento vencido
 * - PAYMENT_REFUNDED: Pagamento estornado
 * - PAYMENT_DELETED: Pagamento cancelado
 *
 * Documentação: https://docs.asaas.com/docs/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticação do webhook (opcional mas recomendado)
    const webhookToken = request.headers.get('asaas-access-token');
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;

    if (expectedToken && webhookToken !== expectedToken) {
      console.warn('[Asaas Webhook] Token inválido recebido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse do body
    let payload: AsaasWebhookPayload;
    try {
      payload = await request.json();
    } catch {
      console.error('[Asaas Webhook] Body inválido');
      return NextResponse.json({ received: true });
    }

    console.log('[Asaas Webhook] Recebido:', {
      event: payload.event,
      paymentId: payload.payment?.id,
      status: payload.payment?.status,
    });

    // Processar webhook
    const processed = processWebhook(payload);

    // Se não tem payment ID, ignorar
    if (!processed.paymentId) {
      console.log('[Asaas Webhook] Sem payment ID, ignorando');
      return NextResponse.json({ received: true });
    }

    // Processar pagamento
    await processAsaasPaymentNotification(processed.paymentId, payload);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Asaas Webhook] Erro:', error);
    // Sempre retornar 200 para evitar reenvios
    return NextResponse.json({ received: true, error: 'Erro processado' });
  }
}

/**
 * GET /api/payments/asaas/webhook
 * Endpoint de verificação (Asaas pode fazer GET para testar)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook Asaas ativo',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Processar notificação de pagamento Asaas
 */
async function processAsaasPaymentNotification(
  asaasPaymentId: string,
  payload: AsaasWebhookPayload
) {
  console.log('[Asaas Webhook] Processando pagamento:', asaasPaymentId);

  try {
    const processed = processWebhook(payload);

    // Buscar pagamento local pela referência externa ou ID Asaas
    const payments = await getAllEntities<Payment>(PAYMENTS_KEY);
    const localPayment = payments.find(
      p =>
        p.asaasPaymentId === asaasPaymentId ||
        p.externalReference === processed.externalReference
    );

    if (!localPayment) {
      console.log('[Asaas Webhook] Pagamento local não encontrado para:', asaasPaymentId);

      // Buscar dados completos do pagamento no Asaas para log
      const asaasPayment = await getAsaasPayment(asaasPaymentId);
      if (asaasPayment) {
        console.log('[Asaas Webhook] Dados do Asaas:', {
          id: asaasPayment.id,
          value: asaasPayment.value,
          status: asaasPayment.status,
          externalReference: asaasPayment.externalReference,
        });
      }
      return;
    }

    // Atualizar status do pagamento local
    const updatedPayment: Payment = {
      ...localPayment,
      status: processed.status || localPayment.status,
      statusDetail: processed.asaasStatus,
      updatedAt: new Date().toISOString(),
    };

    // Se foi pago, adicionar data de pagamento
    if (processed.isPaid) {
      updatedPayment.paidAt = new Date().toISOString();
    }

    // Se foi estornado
    if (processed.isRefunded) {
      updatedPayment.refundedAt = new Date().toISOString();
    }

    await setEntity(PAYMENTS_KEY, localPayment.id, updatedPayment);

    console.log('[Asaas Webhook] Pagamento atualizado:', {
      id: localPayment.id,
      event: payload.event,
      status: processed.status,
    });

    // Executar ações pós-evento
    if (processed.isPaid) {
      await onPaymentApproved(updatedPayment);
    } else if (processed.isRefunded) {
      await onPaymentRefunded(updatedPayment);
    } else if (processed.isCancelled) {
      await onPaymentCancelled(updatedPayment);
    }
  } catch (error) {
    console.error('[Asaas Webhook] Erro ao processar pagamento:', error);
  }
}

/**
 * Ações após pagamento aprovado
 */
async function onPaymentApproved(payment: Payment) {
  console.log('[Asaas Webhook] Pagamento aprovado:', payment.id);

  try {
    // Se for assinatura de SaaS, processar comissões de afiliados
    if (payment.type === 'subscription' && payment.userId) {
      // Extrair tenantId do externalReference (formato: accountId:paymentId)
      const [accountId] = (payment.externalReference || '').split(':');

      if (accountId) {
        console.log('[Asaas Webhook] Processando comissões de afiliados para:', accountId);

        const referenceMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

        try {
          const entries = await processAffiliateSaaSPayment(
            accountId, // tenantId
            payment.userId,
            payment.id,
            payment.amount,
            referenceMonth
          );

          console.log(`[Asaas Webhook] ${entries.length} comissões de afiliados criadas`);
        } catch (affiliateError) {
          // Não falhar o webhook por erro de afiliados
          console.error('[Asaas Webhook] Erro ao processar afiliados:', affiliateError);
        }
      }
    }

    // TODO: Outras ações
    // - Ativar/renovar assinatura
    // - Ativar campanha de anunciante
    // - Enviar email de confirmação
    // - Gerar nota fiscal

    console.log('[Asaas Webhook] Ações pós-pagamento para:', {
      type: payment.type,
      accountId: payment.accountId,
      amount: payment.amount,
    });
  } catch (error) {
    console.error('[Asaas Webhook] Erro em onPaymentApproved:', error);
  }
}

/**
 * Ações após estorno
 */
async function onPaymentRefunded(payment: Payment) {
  console.log('[Asaas Webhook] Pagamento estornado:', payment.id);

  // TODO: Implementar ações de estorno
  // - Cancelar assinatura
  // - Desativar campanha
  // - Reverter comissões de afiliados
}

/**
 * Ações após cancelamento
 */
async function onPaymentCancelled(payment: Payment) {
  console.log('[Asaas Webhook] Pagamento cancelado:', payment.id);

  // TODO: Implementar ações de cancelamento
}
