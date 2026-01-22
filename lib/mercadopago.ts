import { MercadoPagoConfig, Payment as MPPayment, Preference } from 'mercadopago';
import { Payment, PaymentStatus, PaymentMethod, Subscription } from '@/types';

// Configuração do MercadoPago
const isProduction = process.env.NODE_ENV === 'production';
const accessToken = isProduction
  ? process.env.MERCADOPAGO_ACCESS_TOKEN
  : process.env.MERCADOPAGO_ACCESS_TOKEN_TEST || process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!accessToken) {
  console.warn('[MercadoPago] Access token não configurado');
}

const client = accessToken ? new MercadoPagoConfig({
  accessToken,
  options: { timeout: 5000 }
}) : null;

// Helper para mapear status do MP para nosso status
function mapPaymentStatus(mpStatus: string): PaymentStatus {
  const statusMap: Record<string, PaymentStatus> = {
    'pending': 'pending',
    'approved': 'approved',
    'authorized': 'approved',
    'in_process': 'in_process',
    'in_mediation': 'in_process',
    'rejected': 'rejected',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'charged_back': 'refunded',
  };
  return statusMap[mpStatus] || 'pending';
}

// ============================================
// CRIAR PAGAMENTO PIX
// ============================================
export interface CreatePixPaymentParams {
  amount: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  payerName?: string;
  payerCpf?: string;
  expirationMinutes?: number; // Default: 30 minutos
}

export interface PixPaymentResult {
  success: boolean;
  paymentId?: string;
  mpPaymentId?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  copiaECola?: string;
  expiresAt?: string;
  error?: string;
}

export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  if (!client) {
    return { success: false, error: 'MercadoPago não configurado' };
  }

  try {
    const payment = new MPPayment(client);

    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + (params.expirationMinutes || 30));

    const response = await payment.create({
      body: {
        transaction_amount: params.amount,
        description: params.description,
        payment_method_id: 'pix',
        payer: {
          email: params.payerEmail,
          first_name: params.payerName,
          identification: params.payerCpf ? {
            type: 'CPF',
            number: params.payerCpf.replace(/\D/g, ''),
          } : undefined,
        },
        date_of_expiration: expirationDate.toISOString(),
        external_reference: params.externalReference,
      },
    });

    const pointOfInteraction = response.point_of_interaction;
    const transactionData = pointOfInteraction?.transaction_data;

    return {
      success: true,
      mpPaymentId: String(response.id),
      qrCode: transactionData?.qr_code,
      qrCodeBase64: transactionData?.qr_code_base64,
      copiaECola: transactionData?.qr_code,
      expiresAt: response.date_of_expiration,
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar PIX:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar pagamento PIX',
    };
  }
}

// ============================================
// CRIAR PREFERÊNCIA (CHECKOUT PRO)
// ============================================
export interface CreatePreferenceParams {
  items: {
    title: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }[];
  externalReference: string;
  payerEmail?: string;
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  autoReturn?: 'approved' | 'all';
  notificationUrl?: string;
  expirationDateFrom?: string;
  expirationDateTo?: string;
}

export interface PreferenceResult {
  success: boolean;
  preferenceId?: string;
  initPoint?: string;     // URL para checkout em produção
  sandboxInitPoint?: string; // URL para checkout em sandbox
  error?: string;
}

export async function createPreference(params: CreatePreferenceParams): Promise<PreferenceResult> {
  if (!client) {
    return { success: false, error: 'MercadoPago não configurado' };
  }

  try {
    const preference = new Preference(client);

    const response = await preference.create({
      body: {
        items: params.items.map((item, index) => ({
          id: `item_${index + 1}`,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          description: item.description,
          currency_id: 'BRL',
        })),
        external_reference: params.externalReference,
        payer: params.payerEmail ? { email: params.payerEmail } : undefined,
        back_urls: params.backUrls,
        auto_return: params.autoReturn,
        notification_url: params.notificationUrl,
        expires: !!params.expirationDateTo,
        expiration_date_from: params.expirationDateFrom,
        expiration_date_to: params.expirationDateTo,
        payment_methods: {
          excluded_payment_types: [],
          installments: 12, // Máximo de parcelas
        },
      },
    });

    return {
      success: true,
      preferenceId: response.id,
      initPoint: response.init_point,
      sandboxInitPoint: response.sandbox_init_point,
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao criar preferência:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar preferência',
    };
  }
}

// ============================================
// BUSCAR PAGAMENTO
// ============================================
export interface PaymentDetails {
  id: string;
  status: PaymentStatus;
  statusDetail?: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  paidAt?: string;
  payerEmail?: string;
  externalReference?: string;
}

export async function getPayment(mpPaymentId: string): Promise<PaymentDetails | null> {
  if (!client) {
    return null;
  }

  try {
    const payment = new MPPayment(client);
    const response = await payment.get({ id: mpPaymentId });

    let paymentMethod: PaymentMethod | undefined;
    if (response.payment_type_id === 'bank_transfer' || response.payment_method_id === 'pix') {
      paymentMethod = 'pix';
    } else if (response.payment_type_id === 'credit_card') {
      paymentMethod = 'credit_card';
    } else if (response.payment_type_id === 'ticket') {
      paymentMethod = 'boleto';
    }

    return {
      id: String(response.id),
      status: mapPaymentStatus(response.status || 'pending'),
      statusDetail: response.status_detail,
      amount: response.transaction_amount || 0,
      paymentMethod,
      paidAt: response.date_approved,
      payerEmail: response.payer?.email,
      externalReference: response.external_reference,
    };
  } catch (error) {
    console.error('[MercadoPago] Erro ao buscar pagamento:', error);
    return null;
  }
}

// ============================================
// CANCELAR/REEMBOLSAR PAGAMENTO
// ============================================
export async function refundPayment(mpPaymentId: string, amount?: number): Promise<boolean> {
  if (!accessToken) {
    return false;
  }

  try {
    // Usar API REST diretamente para refund
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: amount ? JSON.stringify({ amount }) : undefined,
    });

    return response.ok;
  } catch (error) {
    console.error('[MercadoPago] Erro ao reembolsar:', error);
    return false;
  }
}

// ============================================
// CALCULAR PREÇO PARA OPERADORES
// ============================================
export function calculateOperatorPrice(
  monitorCount: number,
  pricePerMonitor: number = 35
): { amount: number; description: string } {
  const amount = monitorCount * pricePerMonitor;
  return {
    amount,
    description: `Assinatura BoxPratico - ${monitorCount} monitor${monitorCount > 1 ? 'es' : ''} (R$${pricePerMonitor}/monitor)`,
  };
}

// ============================================
// CALCULAR PREÇO PARA ANUNCIANTES
// ============================================
export function calculateAdvertiserPrice(
  screenCount: number,
  basePricePerScreen: number = 35,
  volumeDiscounts: { minScreens: number; maxScreens: number; pricePerScreen: number }[] = []
): { pricePerScreen: number; totalPrice: number; discount: number } {
  // Encontrar faixa de desconto
  let pricePerScreen = basePricePerScreen;

  for (const tier of volumeDiscounts) {
    if (screenCount >= tier.minScreens && screenCount <= tier.maxScreens) {
      pricePerScreen = tier.pricePerScreen;
      break;
    }
  }

  const totalPrice = screenCount * pricePerScreen;
  const fullPrice = screenCount * basePricePerScreen;
  const discount = fullPrice > totalPrice ? Math.round((1 - totalPrice / fullPrice) * 100) : 0;

  return {
    pricePerScreen,
    totalPrice,
    discount,
  };
}

// ============================================
// VERIFICAR SE MP ESTÁ CONFIGURADO
// ============================================
export function isMercadoPagoConfigured(): boolean {
  return !!accessToken;
}

// ============================================
// OBTER URLS DE CALLBACK
// ============================================
export function getCallbackUrls(baseUrl: string) {
  return {
    success: `${baseUrl}/pagamento/sucesso`,
    failure: `${baseUrl}/pagamento/erro`,
    pending: `${baseUrl}/pagamento/pendente`,
    notification: `${baseUrl}/api/payments/webhook`,
  };
}
