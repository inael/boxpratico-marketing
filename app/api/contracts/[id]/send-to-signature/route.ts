/**
 * API para enviar contrato para assinatura digital via AssinaAgora
 *
 * POST /api/contracts/[id]/send-to-signature
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContractById, updateContract } from '@/lib/database';
import {
  assinaAgoraService,
  formatContractDataForTemplate,
  AssinaAgoraSigner
} from '@/lib/assinaagora';

type RouteParams = Promise<{ id: string }>;

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;

    // 1. Verificar se AssinaAgora está configurado
    if (!assinaAgoraService.isConfigured()) {
      return NextResponse.json(
        { error: 'Integração AssinaAgora não está configurada. Verifique as variáveis de ambiente.' },
        { status: 400 }
      );
    }

    // 2. Buscar contrato
    const contract = await getContractById(id);
    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }

    // 3. Verificar se já foi enviado
    if (contract.assinaAgoraDocId) {
      return NextResponse.json(
        {
          error: 'Contrato já foi enviado para assinatura',
          document_id: contract.assinaAgoraDocId,
          status: contract.assinaAgoraStatus
        },
        { status: 400 }
      );
    }

    // 4. Verificar se contrato tem email para envio
    if (!contract.partyBEmail) {
      return NextResponse.json(
        { error: 'Contrato não possui email do contratado (partyBEmail). Adicione o email antes de enviar para assinatura.' },
        { status: 400 }
      );
    }

    // 5. Dados do contratante (Parte A)
    // Usa dados do contrato ou valores padrão
    const partyAName = contract.partyAName || 'BoxPratico';
    const partyACnpj = contract.partyACnpj || '';

    // 6. Montar signatários
    // Para a Parte A, usamos o email do contrato ou um padrão
    const partyAEmail = process.env.ADMIN_EMAIL || 'admin@boxpratico.com.br';

    const signers: AssinaAgoraSigner[] = [
      // Parte A (Operador/Empresa)
      {
        name: partyAName,
        email: partyAEmail,
        role: 'signer',
        order: 1
      },
      // Parte B (Cliente)
      {
        name: contract.partyBName,
        email: contract.partyBEmail,
        role: 'signer',
        order: 2
      }
    ];

    // 7. Formatar dados para template
    const templateData = formatContractDataForTemplate({
      id: contract.id,
      number: (contract as { number?: string }).number,
      partyAName,
      partyACnpj,
      partyBName: contract.partyBName,
      partyBDocument: contract.partyBDocument,
      partyBEmail: contract.partyBEmail,
      monthlyValue: contract.monthlyValue,
      totalValue: contract.totalValue,
      startDate: contract.startDate,
      endDate: contract.endDate,
      notes: contract.notes
    });

    // 8. Enviar para AssinaAgora
    const result = await assinaAgoraService.createDocumentWithTemplate({
      title: `Contrato ${contract.type === 'advertising' ? 'de Publicidade' : contract.type === 'partnership' ? 'de Parceria' : ''} - ${contract.partyBName}`,
      templateId: 'default_contract', // TODO: permitir configurar template por tipo
      templateData,
      signers,
      metadata: {
        contract_id: contract.id,
        contract_number: (contract as { number?: string }).number || contract.id.substring(0, 8).toUpperCase(),
        advertiser: contract.partyBName,
        total_value: contract.totalValue || contract.monthlyValue,
        tenant_id: (contract as { tenantId?: string }).tenantId
      },
      signingMode: 'sequential',
      category: 'contract'
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar para AssinaAgora' },
        { status: 500 }
      );
    }

    // 9. Atualizar contrato com dados do AssinaAgora
    await updateContract(id, {
      assinaAgoraDocId: result.data.document_id,
      assinaAgoraStatus: 'pending',
      status: 'pending_signature'
    });

    // 10. Retornar resposta com URL de assinatura
    return NextResponse.json({
      success: true,
      document_id: result.data.document_id,
      redirect_url: result.data.redirect_url,
      status: result.data.status,
      signers: result.data.signers,
      message: 'Contrato enviado para assinatura. Os signatários receberão email com o link.'
    });

  } catch (error) {
    console.error('[API] Erro ao enviar contrato para assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno ao enviar contrato para assinatura' },
      { status: 500 }
    );
  }
}
