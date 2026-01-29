/**
 * Webhook endpoint para AssinaAgora
 *
 * Recebe notificações sobre eventos de documentos:
 * - document.created - Documento criado
 * - document.signed - Totalmente assinado
 * - document.partially_signed - Parcialmente assinado
 * - document.cancelled - Cancelado
 * - signer.signed - Um signatário assinou
 */

import { NextRequest, NextResponse } from 'next/server';
import { assinaAgoraService, mapAssinaAgoraStatusToContractStatus, WebhookPayload } from '@/lib/assinaagora';
import { updateContract, getContractById } from '@/lib/database';
import { onContractSigned } from '@/lib/contract-automation';

export async function POST(request: NextRequest) {
  try {
    // 1. Obter payload raw para validação HMAC
    const rawPayload = await request.text();
    const signature = request.headers.get('x-assinaagora-signature') || '';

    // 2. Validar assinatura HMAC (CRÍTICO!)
    if (!assinaAgoraService.validateWebhookSignature(rawPayload, signature)) {
      console.error('[Webhook AssinaAgora] Assinatura inválida');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 3. Parsear payload
    const payload = assinaAgoraService.parseWebhookPayload(rawPayload);
    if (!payload) {
      console.error('[Webhook AssinaAgora] Payload inválido');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log(`[Webhook AssinaAgora] Evento recebido: ${payload.event}`, {
      document_id: payload.data.document_id,
      status: payload.data.status,
      contract_id: payload.data.metadata?.contract_id
    });

    // 4. Processar evento
    await processWebhookEvent(payload);

    // 5. Responder rapidamente (importante para evitar retry)
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[Webhook AssinaAgora] Erro ao processar:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Processa evento do webhook
 */
async function processWebhookEvent(payload: WebhookPayload): Promise<void> {
  const { event, data } = payload;
  const contractId = data.metadata?.contract_id;

  if (!contractId) {
    console.warn('[Webhook AssinaAgora] Evento sem contract_id no metadata');
    return;
  }

  switch (event) {
    case 'document.created':
      await handleDocumentCreated(contractId, data);
      break;

    case 'document.signed':
      await handleDocumentSigned(contractId, data);
      break;

    case 'document.partially_signed':
      await handlePartiallySignedDocument(contractId, data);
      break;

    case 'document.cancelled':
      await handleDocumentCancelled(contractId, data);
      break;

    case 'signer.signed':
      await handleSignerSigned(contractId, data);
      break;

    default:
      console.log(`[Webhook AssinaAgora] Evento não tratado: ${event}`);
  }
}

/**
 * Documento criado no AssinaAgora
 */
async function handleDocumentCreated(
  contractId: string,
  data: WebhookPayload['data']
): Promise<void> {
  console.log(`[Webhook AssinaAgora] Documento criado para contrato ${contractId}`);

  try {
    await updateContract(contractId, {
      assinaAgoraDocId: data.document_id,
      assinaAgoraStatus: 'pending',
      status: 'pending_signature'
    });
  } catch (error) {
    console.error(`[Webhook AssinaAgora] Erro ao atualizar contrato ${contractId}:`, error);
  }
}

/**
 * Documento totalmente assinado
 */
async function handleDocumentSigned(
  contractId: string,
  data: WebhookPayload['data']
): Promise<void> {
  console.log(`[Webhook AssinaAgora] Documento ASSINADO para contrato ${contractId}`);

  try {
    // 1. Obter URL do PDF assinado
    let signedPdfUrl: string | undefined;
    if (data.document_id) {
      const downloadResult = await assinaAgoraService.getSignedPdfUrl(data.document_id);
      if (downloadResult.success && downloadResult.url) {
        signedPdfUrl = downloadResult.url;
      }
    }

    // 2. Atualizar contrato no banco
    await updateContract(contractId, {
      assinaAgoraStatus: 'signed',
      status: 'active',
      signedAt: data.signed_at || new Date().toISOString(),
      signedPdfUrl
    });

    // 3. Executar automação pós-assinatura
    const contract = await getContractById(contractId);
    if (contract && contract.partyBEmail) {
      // Criar usuário e campanha se for contrato de anunciante
      if (contract.type === 'advertising') {
        await onContractSigned({
          contract,
          advertiserEmail: contract.partyBEmail,
          advertiserName: contract.partyBName,
          advertiserPhone: contract.partyBPhone,
          managementType: 'SELF_SERVICE', // TODO: pegar do contrato
          selectedTerminalIds: [], // TODO: pegar terminais do contrato
          tenantId: (contract as { tenantId?: string }).tenantId || ''
        });
      }
    }

    console.log(`[Webhook AssinaAgora] Contrato ${contractId} atualizado para ATIVO`);

  } catch (error) {
    console.error(`[Webhook AssinaAgora] Erro ao processar assinatura do contrato ${contractId}:`, error);
  }
}

/**
 * Documento parcialmente assinado
 */
async function handlePartiallySignedDocument(
  contractId: string,
  data: WebhookPayload['data']
): Promise<void> {
  console.log(
    `[Webhook AssinaAgora] Documento parcialmente assinado (${data.signers_completed}/${data.signers_total}) para contrato ${contractId}`
  );

  try {
    await updateContract(contractId, {
      assinaAgoraStatus: 'partially_signed',
      status: 'pending_signature'
    });
  } catch (error) {
    console.error(`[Webhook AssinaAgora] Erro ao atualizar contrato ${contractId}:`, error);
  }
}

/**
 * Documento cancelado
 */
async function handleDocumentCancelled(
  contractId: string,
  data: WebhookPayload['data']
): Promise<void> {
  console.log(`[Webhook AssinaAgora] Documento CANCELADO para contrato ${contractId}: ${data.reason || 'Sem motivo'}`);

  try {
    await updateContract(contractId, {
      assinaAgoraStatus: 'cancelled',
      status: 'cancelled',
      notes: data.reason ? `Cancelado via AssinaAgora: ${data.reason}` : undefined
    });
  } catch (error) {
    console.error(`[Webhook AssinaAgora] Erro ao cancelar contrato ${contractId}:`, error);
  }
}

/**
 * Um signatário assinou
 */
async function handleSignerSigned(
  contractId: string,
  data: WebhookPayload['data']
): Promise<void> {
  console.log(
    `[Webhook AssinaAgora] Signatário ${data.signer_name} (${data.signer_email}) assinou documento do contrato ${contractId}`
  );

  // Apenas log, não precisa atualizar status
  // O evento document.signed ou document.partially_signed cuidará da atualização
}
