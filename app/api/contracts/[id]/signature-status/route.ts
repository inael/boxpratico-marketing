/**
 * API para verificar status de assinatura de contrato no AssinaAgora
 *
 * GET /api/contracts/[id]/signature-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getContractById, updateContract } from '@/lib/database';
import { assinaAgoraService, mapAssinaAgoraStatusToContractStatus } from '@/lib/assinaagora';

type RouteParams = Promise<{ id: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;

    // 1. Verificar se AssinaAgora está configurado
    if (!assinaAgoraService.isConfigured()) {
      return NextResponse.json(
        { error: 'Integração AssinaAgora não está configurada' },
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

    // 3. Verificar se tem documento no AssinaAgora
    if (!contract.assinaAgoraDocId) {
      return NextResponse.json(
        {
          success: true,
          has_document: false,
          contract_status: contract.status,
          message: 'Contrato ainda não foi enviado para assinatura'
        }
      );
    }

    // 4. Consultar status no AssinaAgora
    const result = await assinaAgoraService.getDocumentStatus(contract.assinaAgoraDocId);

    if (!result.success || !result.data) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erro ao consultar status no AssinaAgora',
          contract_status: contract.status,
          assina_agora_status: contract.assinaAgoraStatus
        }
      );
    }

    // 5. Atualizar status local se mudou
    const newStatus = mapAssinaAgoraStatusToContractStatus(result.data.status);
    if (result.data.status !== contract.assinaAgoraStatus) {
      await updateContract(id, {
        assinaAgoraStatus: result.data.status,
        status: newStatus,
        signedAt: result.data.signed_at,
        signedPdfUrl: result.data.status === 'signed' ? result.data.download_url : undefined
      });
    }

    // 6. Retornar status detalhado
    return NextResponse.json({
      success: true,
      has_document: true,
      document_id: contract.assinaAgoraDocId,
      document_status: result.data.status,
      contract_status: newStatus,
      signers: result.data.signers.map(s => ({
        name: s.name,
        email: s.email,
        status: s.status,
        signed_at: s.signed_at
      })),
      signed_at: result.data.signed_at,
      download_url: result.data.status === 'signed' ? result.data.download_url : undefined,
      redirect_url: result.data.redirect_url
    });

  } catch (error) {
    console.error('[API] Erro ao verificar status de assinatura:', error);
    return NextResponse.json(
      { error: 'Erro interno ao verificar status' },
      { status: 500 }
    );
  }
}
