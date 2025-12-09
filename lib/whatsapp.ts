// WPPConnect integration library
const WPP_API_URL = process.env.WPP_API_URL || 'https://whatsapp.toolpad.cloud';
const WPP_SECRET_KEY = process.env.WPP_SECRET_KEY;
const WPP_SESSION = process.env.WPP_SESSION || 'boxpratico';

interface WppResponse {
  status: string;
  message?: string;
  qrcode?: string;
  urlcode?: string;
  session?: string;
  state?: string;
}

interface SendMessageParams {
  phone: string;
  message: string;
  isGroup?: boolean;
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

// Get session token
async function getToken(): Promise<string | null> {
  if (!WPP_SECRET_KEY) {
    console.error('WPP_SECRET_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/${WPP_SECRET_KEY}/generate-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to generate token:', response.status);
      return null;
    }

    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('Error generating token:', error);
    return null;
  }
}

// Start session and get QR code
export async function startSession(): Promise<WppResponse> {
  if (!WPP_SECRET_KEY) {
    return { status: 'error', message: 'WPP_SECRET_KEY não configurada' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { status: 'error', message: 'Falha ao gerar token' };
    }

    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/start-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting session:', error);
    return { status: 'error', message: 'Erro ao iniciar sessão' };
  }
}

// Get session status
export async function getSessionStatus(): Promise<WppResponse> {
  if (!WPP_SECRET_KEY) {
    return { status: 'error', message: 'WPP_SECRET_KEY não configurada' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { status: 'error', message: 'Falha ao gerar token' };
    }

    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/status-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting session status:', error);
    return { status: 'error', message: 'Erro ao verificar status' };
  }
}

// Get QR code
export async function getQRCode(): Promise<WppResponse> {
  if (!WPP_SECRET_KEY) {
    return { status: 'error', message: 'WPP_SECRET_KEY não configurada' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { status: 'error', message: 'Falha ao gerar token' };
    }

    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/qrcode-session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting QR code:', error);
    return { status: 'error', message: 'Erro ao obter QR code' };
  }
}

// Close session
export async function closeSession(): Promise<WppResponse> {
  if (!WPP_SECRET_KEY) {
    return { status: 'error', message: 'WPP_SECRET_KEY não configurada' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { status: 'error', message: 'Falha ao gerar token' };
    }

    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/close-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error closing session:', error);
    return { status: 'error', message: 'Erro ao encerrar sessão' };
  }
}

// Logout session
export async function logoutSession(): Promise<WppResponse> {
  if (!WPP_SECRET_KEY) {
    return { status: 'error', message: 'WPP_SECRET_KEY não configurada' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { status: 'error', message: 'Falha ao gerar token' };
    }

    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/logout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging out:', error);
    return { status: 'error', message: 'Erro ao fazer logout' };
  }
}

// Send message
export async function sendMessage({ phone, message, isGroup = false }: SendMessageParams): Promise<WppResponse> {
  if (!WPP_SECRET_KEY) {
    return { status: 'error', message: 'WPP_SECRET_KEY não configurada' };
  }

  try {
    const token = await getToken();
    if (!token) {
      return { status: 'error', message: 'Falha ao gerar token' };
    }

    const formattedPhone = formatPhoneNumber(phone);

    const response = await fetch(`${WPP_API_URL}/api/${WPP_SESSION}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        phone: formattedPhone,
        message: message,
        isGroup: isGroup,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return { status: 'error', message: 'Erro ao enviar mensagem' };
  }
}

// Check if WhatsApp is configured
export function isWhatsAppConfigured(): boolean {
  return !!WPP_SECRET_KEY;
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

  if (result.status === 'success' || result.status === 'PENDING') {
    return { success: true };
  }

  return { success: false, message: result.message };
}
