/**
 * AssinaAgora Integration Service
 *
 * Serviço para integração com a plataforma de assinatura digital AssinaAgora.
 * Permite enviar contratos para assinatura, consultar status e receber webhooks.
 */

import crypto from 'crypto';

// ============================================
// CONFIGURAÇÃO
// ============================================

const API_URL = process.env.ASSINA_AGORA_API_URL || 'https://assinaagora.com/api/integration';
const API_KEY = process.env.ASSINA_AGORA_API_KEY || '';
const WEBHOOK_SECRET = process.env.ASSINA_AGORA_WEBHOOK_SECRET || '';
const WEBHOOK_URL = process.env.ASSINA_AGORA_WEBHOOK_URL || '';

// ============================================
// TIPOS
// ============================================

export interface AssinaAgoraSigner {
  name: string;
  email: string;
  role?: 'signer' | 'witness' | 'approver';
  order?: number;
}

export interface AssinaAgoraMetadata {
  contract_id: string;
  contract_number?: string;
  advertiser?: string;
  total_value?: number;
  tenant_id?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CreateDocumentInput {
  title: string;
  signers: AssinaAgoraSigner[];
  metadata?: AssinaAgoraMetadata;
  signingMode?: 'sequential' | 'parallel';
  category?: 'contract' | 'proposal' | 'nda' | 'other';
}

export interface CreateDocumentWithFileInput extends CreateDocumentInput {
  filePath: string;
}

export interface CreateDocumentWithTemplateInput extends CreateDocumentInput {
  templateId: string;
  templateData: Record<string, string | number>;
}

export interface AssinaAgoraSignerResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'pending' | 'signed' | 'rejected';
  signed_at?: string;
  order: number;
}

export interface AssinaAgoraDocumentResponse {
  document_id: string;
  title: string;
  status: 'draft' | 'pending' | 'partially_signed' | 'signed' | 'completed' | 'cancelled' | 'expired';
  signing_mode: 'sequential' | 'parallel';
  redirect_url: string;
  download_url: string;
  signers: AssinaAgoraSignerResponse[];
  metadata?: AssinaAgoraMetadata;
  created_at: string;
  updated_at: string;
  signed_at?: string;
  cancelled_at?: string;
}

export interface AssinaAgoraTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  variables: string[];
  page_size: 'A4' | 'Letter' | 'Legal';
  page_orientation: 'portrait' | 'landscape';
  status: 'active' | 'inactive';
  usage_count: number;
  created_at: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: {
    document_id: string;
    title?: string;
    status?: string;
    signed_at?: string;
    cancelled_at?: string;
    reason?: string;
    signers_completed?: number;
    signers_total?: number;
    signer_id?: string;
    signer_name?: string;
    signer_email?: string;
    metadata?: AssinaAgoraMetadata;
    download_url?: string;
  };
}

// ============================================
// SERVIÇO PRINCIPAL
// ============================================

class AssinaAgoraService {
  private apiKey: string;
  private apiUrl: string;
  private webhookSecret: string;
  private webhookUrl: string;

  constructor() {
    this.apiKey = API_KEY;
    this.apiUrl = API_URL;
    this.webhookSecret = WEBHOOK_SECRET;
    this.webhookUrl = WEBHOOK_URL;
  }

  /**
   * Verifica se a integração está configurada
   */
  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Cria documento com upload de PDF (via URL)
   * Nota: Para upload de arquivo local, usar createDocumentWithPdfUrl
   */
  async createDocumentWithFile(
    input: CreateDocumentWithFileInput
  ): Promise<{ success: boolean; data?: AssinaAgoraDocumentResponse; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado. Verifique as variáveis de ambiente.' };
    }

    try {
      // Usar API JSON - AssinaAgora aceita file_url para arquivos hospedados
      // Para upload de arquivos locais, use uma solução de storage (Vercel Blob, S3)
      const requestBody = {
        title: input.title,
        file_url: input.filePath, // Espera-se uma URL, não caminho local
        category: input.category || 'contract',
        signing_mode: input.signingMode || 'sequential',
        signers: input.signers.map((s, i) => ({
          name: s.name,
          email: s.email,
          role: s.role || 'signer',
          order: s.order || i + 1
        })),
        metadata: input.metadata,
        webhook_url: this.webhookUrl || undefined
      };

      const response = await fetch(`${this.apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro ao criar documento' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao criar documento com arquivo:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Cria documento usando template
   */
  async createDocumentWithTemplate(
    input: CreateDocumentWithTemplateInput
  ): Promise<{ success: boolean; data?: AssinaAgoraDocumentResponse; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado. Verifique as variáveis de ambiente.' };
    }

    try {
      const requestBody = {
        title: input.title,
        template_id: input.templateId,
        template_data: input.templateData,
        category: input.category || 'contract',
        signing_mode: input.signingMode || 'sequential',
        signers: input.signers.map((s, i) => ({
          name: s.name,
          email: s.email,
          role: s.role || 'signer',
          order: s.order || i + 1
        })),
        metadata: input.metadata,
        webhook_url: this.webhookUrl || undefined
      };

      const response = await fetch(`${this.apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro ao criar documento' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao criar documento com template:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Consulta status de um documento
   */
  async getDocumentStatus(
    documentId: string
  ): Promise<{ success: boolean; data?: AssinaAgoraDocumentResponse; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado.' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Documento não encontrado' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao consultar documento:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Obtém URL de download do PDF assinado
   */
  async getSignedPdfUrl(
    documentId: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado.' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro ao obter URL de download' };
      }

      return { success: true, url: result.data.download_url };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao obter URL de download:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Cancela um documento pendente
   */
  async cancelDocument(
    documentId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado.' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro ao cancelar documento' };
      }

      return { success: true };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao cancelar documento:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Lista templates disponíveis
   */
  async listTemplates(): Promise<{ success: boolean; data?: AssinaAgoraTemplate[]; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado.' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/templates`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro ao listar templates' };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao listar templates:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Registra webhook para receber notificações
   */
  async registerWebhook(
    url: string,
    events: string[],
    secret: string
  ): Promise<{ success: boolean; webhookId?: string; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'AssinaAgora não está configurado.' };
    }

    try {
      const response = await fetch(`${this.apiUrl}/webhooks`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, events, secret })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error?.message || 'Erro ao registrar webhook' };
      }

      return { success: true, webhookId: result.data.webhook_id };
    } catch (error) {
      console.error('[AssinaAgora] Erro ao registrar webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Valida assinatura HMAC do webhook
   * CRÍTICO: Sempre validar antes de processar webhooks!
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      console.warn('[AssinaAgora] Webhook secret não configurado!');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('[AssinaAgora] Erro ao validar assinatura:', error);
      return false;
    }
  }

  /**
   * Processa payload do webhook
   */
  parseWebhookPayload(payload: string): WebhookPayload | null {
    try {
      return JSON.parse(payload) as WebhookPayload;
    } catch (error) {
      console.error('[AssinaAgora] Erro ao parsear webhook:', error);
      return null;
    }
  }
}

// Exportar instância singleton
export const assinaAgoraService = new AssinaAgoraService();

// Exportar classe para testes
export { AssinaAgoraService };

// ============================================
// FUNÇÕES HELPER
// ============================================

/**
 * Mapeia status do AssinaAgora para status do BoxPratico
 */
export function mapAssinaAgoraStatusToContractStatus(
  assinaStatus: string
): 'draft' | 'pending_signature' | 'signed' | 'active' | 'cancelled' | 'expired' {
  const statusMap: Record<string, 'draft' | 'pending_signature' | 'signed' | 'active' | 'cancelled' | 'expired'> = {
    'draft': 'draft',
    'pending': 'pending_signature',
    'partially_signed': 'pending_signature',
    'signed': 'active',
    'completed': 'active',
    'cancelled': 'cancelled',
    'expired': 'expired'
  };

  return statusMap[assinaStatus] || 'pending_signature';
}

/**
 * Formata dados do contrato para template do AssinaAgora
 */
export function formatContractDataForTemplate(contract: {
  id: string;
  number?: string;
  partyAName: string;
  partyACnpj?: string;
  partyBName: string;
  partyBDocument?: string;
  partyBEmail?: string;
  monthlyValue?: number;
  totalValue?: number;
  startDate: string;
  endDate: string;
  notes?: string;
}): Record<string, string | number> {
  return {
    contract_number: contract.number || contract.id.substring(0, 8).toUpperCase(),
    contractor_name: contract.partyAName,
    contractor_document: contract.partyACnpj || '',
    contracted_name: contract.partyBName,
    contracted_document: contract.partyBDocument || '',
    contracted_email: contract.partyBEmail || '',
    monthly_value: contract.monthlyValue
      ? `R$ ${contract.monthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : '',
    total_value: contract.totalValue
      ? `R$ ${contract.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : '',
    start_date: new Date(contract.startDate).toLocaleDateString('pt-BR'),
    end_date: new Date(contract.endDate).toLocaleDateString('pt-BR'),
    notes: contract.notes || ''
  };
}
