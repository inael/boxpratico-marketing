/**
 * Asaas Payment Gateway Integration
 * Documentação: https://docs.asaas.com/
 *
 * Suporta:
 * - PIX (taxa: R$0 emissão, ~0.99% por recebimento)
 * - Boleto (taxa: R$0.99 → R$1.99)
 * - Cartão de Crédito (taxa: 1.99% + R$0.49 → 2.99% + R$0.49)
 */

import { PaymentStatus, PaymentMethod } from '@/types';

// ============================================
// CONFIGURAÇÃO
// ============================================

const isProduction = process.env.NODE_ENV === 'production';
const apiKey = isProduction
  ? process.env.ASAAS_API_KEY
  : process.env.ASAAS_API_KEY_SANDBOX || process.env.ASAAS_API_KEY;

const baseUrl = isProduction
  ? 'https://api.asaas.com/v3'
  : 'https://api-sandbox.asaas.com/v3';

const walletId = process.env.ASAAS_WALLET_ID;

if (!apiKey) {
  console.warn('[Asaas] API key não configurada');
}

// ============================================
// TIPOS ASAAS
// ============================================

export type AsaasBillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';

export type AsaasPaymentStatus =
  | 'PENDING'           // Aguardando pagamento
  | 'RECEIVED'          // Recebido (saldo confirmado)
  | 'CONFIRMED'         // Pagamento confirmado
  | 'OVERDUE'           // Vencida
  | 'REFUNDED'          // Estornada
  | 'RECEIVED_IN_CASH'  // Recebida em dinheiro
  | 'REFUND_REQUESTED'  // Estorno solicitado
  | 'REFUND_IN_PROGRESS'// Estorno em andamento
  | 'CHARGEBACK_REQUESTED' // Chargeback solicitado
  | 'CHARGEBACK_DISPUTE'   // Em disputa de chargeback
  | 'AWAITING_CHARGEBACK_REVERSAL' // Aguardando reversão
  | 'DUNNING_REQUESTED' // Negativação solicitada
  | 'DUNNING_RECEIVED'  // Recuperada por negativação
  | 'AWAITING_RISK_ANALYSIS'; // Aguardando análise de risco

export interface AsaasCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  cpfCnpj: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  city?: number;
  state?: string;
  country?: string;
  observations?: string;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  canDelete?: boolean;
  cannotBeDeletedReason?: string;
  canEdit?: boolean;
  cannotEditReason?: string;
  foreignCustomer?: boolean;
  deleted?: boolean;
  dateCreated?: string;
}

export interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink?: string;
  dueDate: string;
  value: number;
  netValue?: number;
  billingType: AsaasBillingType;
  status: AsaasPaymentStatus;
  description?: string;
  externalReference?: string;
  originalValue?: number;
  interestValue?: number;
  originalDueDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
  installmentNumber?: number;
  transactionReceiptUrl?: string;
  nossoNumero?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  invoiceNumber?: string;
  deleted?: boolean;
  anticipated?: boolean;
  anticipable?: boolean;
  creditDate?: string;
  estimatedCreditDate?: string;
  lastInvoiceViewedDate?: string;
  lastBankSlipViewedDate?: string;
  postalService?: boolean;
  custody?: string;
  refunds?: any[];
}

export interface AsaasPixQrCode {
  encodedImage: string;  // Base64 da imagem QR Code
  payload: string;       // Copia e Cola
  expirationDate: string;
}

export interface AsaasDiscount {
  value: number;
  dueDateLimitDays?: number;
  type: 'FIXED' | 'PERCENTAGE';
}

export interface AsaasFine {
  value: number;
  type?: 'FIXED' | 'PERCENTAGE';
}

export interface AsaasInterest {
  value: number;
  type?: 'PERCENTAGE';
}

export interface AsaasSplit {
  walletId: string;
  fixedValue?: number;
  percentualValue?: number;
  totalFixedValue?: number;
}

// ============================================
// HELPERS
// ============================================

async function asaasRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!apiKey) {
    return { success: false, error: 'Asaas API key não configurada' };
  }

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.errors?.[0]?.description || data.message || 'Erro na requisição Asaas';
      console.error('[Asaas] Erro:', errorMessage, data);
      return { success: false, error: errorMessage };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[Asaas] Erro na requisição:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao conectar com Asaas',
    };
  }
}

// Mapear status Asaas para nosso status interno
function mapAsaasStatus(asaasStatus: AsaasPaymentStatus): PaymentStatus {
  const statusMap: Record<AsaasPaymentStatus, PaymentStatus> = {
    'PENDING': 'pending',
    'RECEIVED': 'approved',
    'CONFIRMED': 'approved',
    'OVERDUE': 'pending',
    'REFUNDED': 'refunded',
    'RECEIVED_IN_CASH': 'approved',
    'REFUND_REQUESTED': 'in_process',
    'REFUND_IN_PROGRESS': 'in_process',
    'CHARGEBACK_REQUESTED': 'in_process',
    'CHARGEBACK_DISPUTE': 'in_process',
    'AWAITING_CHARGEBACK_REVERSAL': 'in_process',
    'DUNNING_REQUESTED': 'pending',
    'DUNNING_RECEIVED': 'approved',
    'AWAITING_RISK_ANALYSIS': 'in_process',
  };
  return statusMap[asaasStatus] || 'pending';
}

// Mapear billingType para nosso PaymentMethod
function mapAsaasBillingType(billingType: AsaasBillingType): PaymentMethod {
  const typeMap: Record<AsaasBillingType, PaymentMethod> = {
    'PIX': 'pix',
    'BOLETO': 'boleto',
    'CREDIT_CARD': 'credit_card',
    'UNDEFINED': 'pix',
  };
  return typeMap[billingType] || 'pix';
}

// ============================================
// CLIENTES
// ============================================

export interface CreateCustomerParams {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface CustomerResult {
  success: boolean;
  customer?: AsaasCustomer;
  error?: string;
}

/**
 * Criar novo cliente no Asaas
 */
export async function createCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
  const result = await asaasRequest<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      cpfCnpj: params.cpfCnpj.replace(/\D/g, ''),
      email: params.email,
      phone: params.phone?.replace(/\D/g, ''),
      mobilePhone: params.mobilePhone?.replace(/\D/g, ''),
      address: params.address,
      addressNumber: params.addressNumber,
      complement: params.complement,
      province: params.province,
      postalCode: params.postalCode?.replace(/\D/g, ''),
      externalReference: params.externalReference,
      notificationDisabled: params.notificationDisabled ?? false,
    }),
  });

  if (result.success && result.data) {
    return { success: true, customer: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Buscar cliente por CPF/CNPJ
 */
export async function findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
  const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
  const result = await asaasRequest<{ data: AsaasCustomer[] }>(`/customers?cpfCnpj=${cleanCpfCnpj}`);

  if (result.success && result.data?.data?.[0]) {
    return result.data.data[0];
  }
  return null;
}

/**
 * Buscar cliente por ID
 */
export async function getCustomer(customerId: string): Promise<AsaasCustomer | null> {
  const result = await asaasRequest<AsaasCustomer>(`/customers/${customerId}`);
  return result.success ? result.data || null : null;
}

/**
 * Buscar ou criar cliente (upsert por CPF/CNPJ)
 */
export async function findOrCreateCustomer(params: CreateCustomerParams): Promise<CustomerResult> {
  // Primeiro tenta encontrar
  const existing = await findCustomerByCpfCnpj(params.cpfCnpj);
  if (existing) {
    return { success: true, customer: existing };
  }

  // Se não encontrou, cria
  return createCustomer(params);
}

// ============================================
// COBRANÇAS
// ============================================

export interface CreatePaymentParams {
  customer: string;  // ID do cliente no Asaas
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;   // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  installmentValue?: number;
  discount?: AsaasDiscount;
  interest?: AsaasInterest;
  fine?: AsaasFine;
  postalService?: boolean;
  split?: AsaasSplit[];
  // Campos específicos para cartão de crédito
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
  remoteIp?: string;
}

export interface PaymentResult {
  success: boolean;
  payment?: AsaasPayment;
  error?: string;
}

/**
 * Criar nova cobrança
 */
export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const body: Record<string, any> = {
    customer: params.customer,
    billingType: params.billingType,
    value: params.value,
    dueDate: params.dueDate,
    description: params.description,
    externalReference: params.externalReference,
    postalService: params.postalService,
  };

  // Parcelamento
  if (params.installmentCount && params.installmentCount > 1) {
    body.installmentCount = params.installmentCount;
    body.installmentValue = params.installmentValue || (params.value / params.installmentCount);
  }

  // Desconto
  if (params.discount) {
    body.discount = params.discount;
  }

  // Juros
  if (params.interest) {
    body.interest = params.interest;
  }

  // Multa
  if (params.fine) {
    body.fine = params.fine;
  }

  // Split de pagamento
  if (params.split) {
    body.split = params.split;
  }

  // Cartão de crédito
  if (params.billingType === 'CREDIT_CARD' && params.creditCard) {
    body.creditCard = params.creditCard;
    body.creditCardHolderInfo = params.creditCardHolderInfo;
    body.remoteIp = params.remoteIp;
  }

  const result = await asaasRequest<AsaasPayment>('/payments', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (result.success && result.data) {
    return { success: true, payment: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Buscar cobrança por ID
 */
export async function getPayment(paymentId: string): Promise<AsaasPayment | null> {
  const result = await asaasRequest<AsaasPayment>(`/payments/${paymentId}`);
  return result.success ? result.data || null : null;
}

/**
 * Buscar QR Code PIX de uma cobrança
 */
export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode | null> {
  const result = await asaasRequest<AsaasPixQrCode>(`/payments/${paymentId}/pixQrCode`);
  return result.success ? result.data || null : null;
}

/**
 * Cancelar/Excluir cobrança
 */
export async function deletePayment(paymentId: string): Promise<boolean> {
  const result = await asaasRequest(`/payments/${paymentId}`, {
    method: 'DELETE',
  });
  return result.success;
}

/**
 * Estornar cobrança
 */
export async function refundPayment(paymentId: string, value?: number, description?: string): Promise<boolean> {
  const body: Record<string, any> = {};
  if (value) body.value = value;
  if (description) body.description = description;

  const result = await asaasRequest(`/payments/${paymentId}/refund`, {
    method: 'POST',
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
  return result.success;
}

/**
 * Listar cobranças de um cliente
 */
export async function listPaymentsByCustomer(customerId: string): Promise<AsaasPayment[]> {
  const result = await asaasRequest<{ data: AsaasPayment[] }>(`/payments?customer=${customerId}`);
  return result.success ? result.data?.data || [] : [];
}

// ============================================
// PAGAMENTO SIMPLIFICADO (WRAPPER)
// ============================================

export interface SimplePaymentParams {
  // Cliente
  customerName: string;
  customerCpfCnpj: string;
  customerEmail?: string;
  customerPhone?: string;
  // Cobrança
  amount: number;
  description: string;
  billingType: AsaasBillingType;
  externalReference?: string;
  dueDate?: string;  // Default: hoje
  // Opcionais
  installmentCount?: number;
}

export interface SimplePaymentResult {
  success: boolean;
  paymentId?: string;
  customerId?: string;
  status?: PaymentStatus;
  billingType?: PaymentMethod;
  // PIX
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixCopiaECola?: string;
  pixExpirationDate?: string;
  // Boleto
  boletoUrl?: string;
  boletoBarcode?: string;
  // Geral
  invoiceUrl?: string;
  dueDate?: string;
  value?: number;
  error?: string;
}

/**
 * Criar pagamento de forma simplificada
 * Cria cliente automaticamente se não existir
 */
export async function createSimplePayment(params: SimplePaymentParams): Promise<SimplePaymentResult> {
  // 1. Buscar ou criar cliente
  const customerResult = await findOrCreateCustomer({
    name: params.customerName,
    cpfCnpj: params.customerCpfCnpj,
    email: params.customerEmail,
    mobilePhone: params.customerPhone,
    externalReference: params.externalReference,
  });

  if (!customerResult.success || !customerResult.customer) {
    return { success: false, error: customerResult.error || 'Erro ao criar cliente' };
  }

  const customerId = customerResult.customer.id;

  // 2. Criar cobrança
  const dueDate = params.dueDate || new Date().toISOString().split('T')[0];

  const paymentResult = await createPayment({
    customer: customerId,
    billingType: params.billingType,
    value: params.amount,
    dueDate,
    description: params.description,
    externalReference: params.externalReference,
    installmentCount: params.installmentCount,
  });

  if (!paymentResult.success || !paymentResult.payment) {
    return { success: false, error: paymentResult.error || 'Erro ao criar cobrança' };
  }

  const payment = paymentResult.payment;
  const result: SimplePaymentResult = {
    success: true,
    paymentId: payment.id,
    customerId,
    status: mapAsaasStatus(payment.status),
    billingType: mapAsaasBillingType(payment.billingType),
    invoiceUrl: payment.invoiceUrl,
    dueDate: payment.dueDate,
    value: payment.value,
  };

  // 3. Se for PIX, buscar QR Code
  if (params.billingType === 'PIX') {
    const pixData = await getPixQrCode(payment.id);
    if (pixData) {
      result.pixQrCodeBase64 = pixData.encodedImage;
      result.pixCopiaECola = pixData.payload;
      result.pixExpirationDate = pixData.expirationDate;
    }
  }

  // 4. Se for boleto, incluir URL
  if (params.billingType === 'BOLETO') {
    result.boletoUrl = payment.bankSlipUrl;
  }

  return result;
}

// ============================================
// ASSINATURAS (SUBSCRIPTIONS)
// ============================================

export type AsaasSubscriptionCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasSubscriptionCycle;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  externalReference?: string;
  deleted?: boolean;
}

export interface CreateSubscriptionParams {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: AsaasSubscriptionCycle;
  description?: string;
  externalReference?: string;
  discount?: AsaasDiscount;
  interest?: AsaasInterest;
  fine?: AsaasFine;
  split?: AsaasSplit[];
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: AsaasSubscription;
  error?: string;
}

/**
 * Criar assinatura recorrente
 */
export async function createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
  const result = await asaasRequest<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (result.success && result.data) {
    return { success: true, subscription: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Buscar assinatura por ID
 */
export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription | null> {
  const result = await asaasRequest<AsaasSubscription>(`/subscriptions/${subscriptionId}`);
  return result.success ? result.data || null : null;
}

/**
 * Cancelar assinatura
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const result = await asaasRequest(`/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
  });
  return result.success;
}

/**
 * Listar cobranças de uma assinatura
 */
export async function listSubscriptionPayments(subscriptionId: string): Promise<AsaasPayment[]> {
  const result = await asaasRequest<{ data: AsaasPayment[] }>(`/subscriptions/${subscriptionId}/payments`);
  return result.success ? result.data?.data || [] : [];
}

// ============================================
// WEBHOOKS
// ============================================

export type AsaasWebhookEvent =
  | 'PAYMENT_CREATED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_ANTICIPATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_PARTIALLY_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED';

export interface AsaasWebhookPayload {
  event: AsaasWebhookEvent;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
}

/**
 * Processar webhook do Asaas
 */
export function processWebhook(payload: AsaasWebhookPayload): {
  event: AsaasWebhookEvent;
  paymentId?: string;
  status?: PaymentStatus;
  asaasStatus?: AsaasPaymentStatus;
  externalReference?: string;
  value?: number;
  isPaid: boolean;
  isRefunded: boolean;
  isCancelled: boolean;
} {
  const payment = payload.payment;

  const paidEvents: AsaasWebhookEvent[] = [
    'PAYMENT_CONFIRMED',
    'PAYMENT_RECEIVED',
    'PAYMENT_DUNNING_RECEIVED',
  ];

  const refundedEvents: AsaasWebhookEvent[] = [
    'PAYMENT_REFUNDED',
    'PAYMENT_PARTIALLY_REFUNDED',
  ];

  const cancelledEvents: AsaasWebhookEvent[] = [
    'PAYMENT_DELETED',
  ];

  return {
    event: payload.event,
    paymentId: payment?.id,
    status: payment ? mapAsaasStatus(payment.status) : undefined,
    asaasStatus: payment?.status,
    externalReference: payment?.externalReference,
    value: payment?.value,
    isPaid: paidEvents.includes(payload.event),
    isRefunded: refundedEvents.includes(payload.event),
    isCancelled: cancelledEvents.includes(payload.event),
  };
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Verificar se Asaas está configurado
 */
export function isAsaasConfigured(): boolean {
  return !!apiKey;
}

/**
 * Obter Wallet ID configurado
 */
export function getWalletId(): string | undefined {
  return walletId;
}

/**
 * Calcular preço para operadores (igual ao MercadoPago)
 */
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

/**
 * Formatar CPF/CNPJ para exibição
 */
export function formatCpfCnpj(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
}

/**
 * Validar CPF
 */
export function isValidCpf(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cleaned.charAt(10));
}

/**
 * Validar CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14 || /^(\d)\1+$/.test(cleaned)) return false;

  const calcDigit = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(base.charAt(i)) * weights[i];
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calcDigit(cleaned.substring(0, 12), weights1);
  const digit2 = calcDigit(cleaned.substring(0, 12) + digit1, weights2);

  return cleaned.endsWith(`${digit1}${digit2}`);
}

/**
 * Validar CPF ou CNPJ
 */
export function isValidCpfCnpj(value: string): boolean {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) return isValidCpf(cleaned);
  if (cleaned.length === 14) return isValidCnpj(cleaned);
  return false;
}
