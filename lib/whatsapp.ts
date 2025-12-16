// Evolution API integration library
import { getEvolutionConfig } from '@/app/api/settings/route';

// Default values from environment (used as fallback)
const ENV_EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
const ENV_EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const ENV_EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'boxpratico';

interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instanceName: string;
}

interface EvolutionResponse {
  status: string;
  message?: string;
  qrcode?: {
    base64?: string;
    code?: string;
  };
  instance?: {
    instanceName?: string;
    state?: string;
    status?: string;
  };
  state?: string;
  error?: string;
}

interface SendMessageParams {
  phone: string;
  message: string;
  isGroup?: boolean;
}

// Get config from settings (DB) or fallback to env vars
async function getConfig(): Promise<EvolutionConfig> {
  try {
    const config = await getEvolutionConfig();
    return config;
  } catch {
    // Fallback to environment variables
    return {
      apiUrl: ENV_EVOLUTION_API_URL,
      apiKey: ENV_EVOLUTION_API_KEY,
      instanceName: ENV_EVOLUTION_INSTANCE,
    };
  }
}

// Format phone number to WhatsApp format (with country code)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // If doesn't have country code (55 for Brazil), add it
  if (!cleaned.startsWith('55') && cleaned.length <= 11) {
    cleaned = '55' + cleaned;
  }

  return cleaned;
}

// Helper to make API requests to Evolution API
async function evolutionFetch(
  endpoint: string,
  options: RequestInit = {},
  config?: EvolutionConfig
): Promise<Response> {
  const cfg = config || await getConfig();
  const url = `${cfg.apiUrl}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': cfg.apiKey,
      ...options.headers,
    },
  });
}

// Create instance if it doesn't exist
async function createInstance(config: EvolutionConfig): Promise<EvolutionResponse> {
  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    const response = await evolutionFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName: config.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    }, config);

    const data = await response.json();

    if (!response.ok) {
      // Instance might already exist
      if (data.error?.includes('already') || data.message?.includes('already')) {
        return { status: 'exists', message: 'Instância já existe' };
      }
      return { status: 'error', message: data.error || data.message || 'Erro ao criar instância' };
    }

    return { status: 'success', ...data };
  } catch (error) {
    console.error('Error creating instance:', error);
    return { status: 'error', message: 'Erro ao criar instância' };
  }
}

// Start session and get QR code (connect instance)
export async function startSession(): Promise<EvolutionResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    // First, try to create the instance (will return 'exists' if already created)
    await createInstance(config);

    // Then connect to get QR code
    const response = await evolutionFetch(`/instance/connect/${config.instanceName}`, {
      method: 'GET',
    }, config);

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.error || data.message || 'Erro ao conectar instância' };
    }

    // Evolution API returns base64 QR code in different format
    if (data.base64) {
      return {
        status: 'qrcode',
        qrcode: {
          base64: data.base64,
          code: data.code,
        },
      };
    }

    return { status: 'success', ...data };
  } catch (error) {
    console.error('Error starting session:', error);
    return { status: 'error', message: 'Erro ao iniciar sessão' };
  }
}

// Get session status (connection state)
export async function getSessionStatus(): Promise<EvolutionResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    const response = await evolutionFetch(`/instance/connectionState/${config.instanceName}`, {
      method: 'GET',
    }, config);

    const data = await response.json();

    if (!response.ok) {
      // Instance might not exist yet
      if (response.status === 404) {
        return { status: 'disconnected', state: 'close', message: 'Instância não encontrada' };
      }
      return { status: 'error', message: data.error || data.message || 'Erro ao verificar status' };
    }

    // Map Evolution API states to our format
    const state = data.instance?.state || data.state || 'close';

    // Evolution API states: open, close, connecting
    let mappedStatus = 'disconnected';
    if (state === 'open') {
      mappedStatus = 'connected';
    } else if (state === 'connecting') {
      mappedStatus = 'connecting';
    }

    return {
      status: mappedStatus,
      state: state,
      instance: data.instance,
    };
  } catch (error) {
    console.error('Error getting session status:', error);
    return { status: 'error', message: 'Erro ao verificar status' };
  }
}

// Get QR code
export async function getQRCode(): Promise<EvolutionResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    // Connect endpoint returns QR code
    const response = await evolutionFetch(`/instance/connect/${config.instanceName}`, {
      method: 'GET',
    }, config);

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.error || data.message || 'Erro ao obter QR code' };
    }

    if (data.base64) {
      return {
        status: 'success',
        qrcode: {
          base64: data.base64,
          code: data.code,
        },
      };
    }

    // If already connected, no QR code needed
    if (data.instance?.state === 'open') {
      return { status: 'connected', message: 'Já conectado' };
    }

    return { status: 'error', message: 'QR code não disponível' };
  } catch (error) {
    console.error('Error getting QR code:', error);
    return { status: 'error', message: 'Erro ao obter QR code' };
  }
}

// Close session (just disconnect, keep instance)
export async function closeSession(): Promise<EvolutionResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    const response = await evolutionFetch(`/instance/logout/${config.instanceName}`, {
      method: 'DELETE',
    }, config);

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.error || data.message || 'Erro ao encerrar sessão' };
    }

    return { status: 'success', message: 'Sessão encerrada com sucesso' };
  } catch (error) {
    console.error('Error closing session:', error);
    return { status: 'error', message: 'Erro ao encerrar sessão' };
  }
}

// Logout session (disconnect and clear session)
export async function logoutSession(): Promise<EvolutionResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    const response = await evolutionFetch(`/instance/logout/${config.instanceName}`, {
      method: 'DELETE',
    }, config);

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.error || data.message || 'Erro ao fazer logout' };
    }

    return { status: 'success', message: 'Logout realizado com sucesso' };
  } catch (error) {
    console.error('Error logging out:', error);
    return { status: 'error', message: 'Erro ao fazer logout' };
  }
}

// Send message
export async function sendMessage({ phone, message, isGroup = false }: SendMessageParams): Promise<EvolutionResponse> {
  const config = await getConfig();

  if (!config.apiKey) {
    return { status: 'error', message: 'API Key não configurada' };
  }

  try {
    const formattedPhone = formatPhoneNumber(phone);

    const endpoint = `/message/sendText/${config.instanceName}`;

    const body = {
      number: formattedPhone,
      text: message,
    };

    const response = await evolutionFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, config);

    const data = await response.json();

    if (!response.ok) {
      return { status: 'error', message: data.error || data.message || 'Erro ao enviar mensagem' };
    }

    return { status: 'success', message: 'Mensagem enviada com sucesso' };
  } catch (error) {
    console.error('Error sending message:', error);
    return { status: 'error', message: 'Erro ao enviar mensagem' };
  }
}

// Check if WhatsApp is configured (sync version for quick checks)
export function isWhatsAppConfigured(): boolean {
  // Check environment variables first (sync check)
  return !!ENV_EVOLUTION_API_KEY;
}

// Async version that also checks settings
export async function isWhatsAppConfiguredAsync(): Promise<boolean> {
  const config = await getConfig();
  return !!config.apiKey;
}

// Notification types
export type NotificationType =
  | 'condominium_created'
  | 'campaign_created'
  | 'campaign_updated'
  | 'campaign_expired'
  | 'media_created'
  | 'media_deleted'
  | 'monitor_created'
  | 'monitor_online'
  | 'monitor_offline';

interface NotificationData {
  condominiumName: string;
  condominiumPhone?: string;
  entityName?: string;
  details?: string;
}

// Build notification message
export function buildNotificationMessage(type: NotificationType, data: NotificationData): string {
  const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const header = `*BoxPrático Marketing*\n_${timestamp}_\n\n`;

  switch (type) {
    case 'condominium_created':
      return `${header}✅ *Condomínio Cadastrado*\n\nO condomínio *${data.condominiumName}* foi cadastrado com sucesso no sistema.`;

    case 'campaign_created':
      return `${header}🎯 *Nova Campanha Criada*\n\nCondomínio: *${data.condominiumName}*\nCampanha: *${data.entityName}*\n${data.details || ''}`;

    case 'campaign_updated':
      return `${header}📝 *Campanha Atualizada*\n\nCondomínio: *${data.condominiumName}*\nCampanha: *${data.entityName}*\n${data.details || ''}`;

    case 'campaign_expired':
      return `${header}⚠️ *Campanha Expirada*\n\nCondomínio: *${data.condominiumName}*\nCampanha: *${data.entityName}*\n\nA campanha atingiu sua data de término e foi desativada automaticamente.`;

    case 'media_created':
      return `${header}📸 *Nova Mídia Adicionada*\n\nCondomínio: *${data.condominiumName}*\nMídia: *${data.entityName}*`;

    case 'media_deleted':
      return `${header}🗑️ *Mídia Removida*\n\nCondomínio: *${data.condominiumName}*\nMídia: *${data.entityName}*`;

    case 'monitor_created':
      return `${header}📺 *Novo Monitor Cadastrado*\n\nCondomínio: *${data.condominiumName}*\nMonitor: *${data.entityName}*`;

    case 'monitor_online':
      return `${header}🟢 *Monitor Online*\n\nCondomínio: *${data.condominiumName}*\nMonitor: *${data.entityName}*\n\nO monitor está funcionando corretamente.`;

    case 'monitor_offline':
      return `${header}🔴 *Monitor Offline*\n\nCondomínio: *${data.condominiumName}*\nMonitor: *${data.entityName}*\n\n⚠️ O monitor não está respondendo. Verifique a conexão.`;

    default:
      return `${header}ℹ️ *Notificação*\n\n${data.details || 'Nova atualização no sistema.'}`;
  }
}

// Send notification to condominium
export async function sendNotification(
  type: NotificationType,
  data: NotificationData
): Promise<{ success: boolean; message?: string }> {
  if (!data.condominiumPhone) {
    return { success: false, message: 'Número de WhatsApp não configurado para este condomínio' };
  }

  const message = buildNotificationMessage(type, data);
  const result = await sendMessage({ phone: data.condominiumPhone, message });

  if (result.status === 'success') {
    return { success: true };
  }

  return { success: false, message: result.message };
}
