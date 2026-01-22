'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Payment, Subscription } from '@/types';
import {
  QrCodeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CreditCardIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

function CheckoutContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Form state for new subscription
  const [monitorCount, setMonitorCount] = useState(1);
  const [pricePerMonitor] = useState(35);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'checkout_pro'>('pix');

  // Get payment ID from URL if exists
  const paymentId = searchParams.get('payment');
  const subscriptionId = searchParams.get('subscription');
  const type = searchParams.get('type') || 'subscription'; // subscription, campaign, etc.

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/pagamento');
    }
  }, [status, router]);

  useEffect(() => {
    if (paymentId) {
      loadPayment(paymentId);
    }
    if (subscriptionId) {
      loadSubscription(subscriptionId);
    }
  }, [paymentId, subscriptionId]);

  // Auto-refresh payment status every 5 seconds if pending
  useEffect(() => {
    if (payment && payment.status === 'pending') {
      const interval = setInterval(() => {
        checkPaymentStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [payment]);

  const loadPayment = async (id: string) => {
    try {
      const response = await fetch(`/api/payments?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data);
      }
    } catch (err) {
      console.error('Error loading payment:', err);
    }
  };

  const loadSubscription = async (id: string) => {
    try {
      const response = await fetch(`/api/subscriptions?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const sub = data.find((s: Subscription) => s.id === id);
          if (sub) setSubscription(sub);
        }
      }
    } catch (err) {
      console.error('Error loading subscription:', err);
    }
  };

  const checkPaymentStatus = async () => {
    if (!payment || checkingStatus) return;

    setCheckingStatus(true);
    try {
      const response = await fetch(`/api/payments?id=${payment.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data);
        if (data.status === 'approved') {
          // Payment approved!
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const createPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // First create subscription if needed
      let subId = subscriptionId;

      if (type === 'subscription' && !subId) {
        const subResponse = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            monitorCount,
            pricePerMonitor,
          }),
        });

        if (!subResponse.ok) {
          const subError = await subResponse.json();
          throw new Error(subError.error || 'Erro ao criar assinatura');
        }

        const subData = await subResponse.json();
        setSubscription(subData.subscription);
        subId = subData.subscription.id;
      }

      // Create payment
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: paymentMethod,
          amount: monitorCount * pricePerMonitor,
          description: `Assinatura BoxPratico - ${monitorCount} monitor${monitorCount > 1 ? 'es' : ''}`,
          subscriptionId: subId,
        }),
      });

      if (!paymentResponse.ok) {
        const payError = await paymentResponse.json();
        throw new Error(payError.error || 'Erro ao criar pagamento');
      }

      const paymentData = await paymentResponse.json();
      setPayment(paymentData.payment);

      // If checkout pro, redirect
      if (paymentMethod === 'checkout_pro' && paymentData.checkoutUrl) {
        window.location.href = paymentData.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = () => {
    if (payment?.pixCopiaECola) {
      navigator.clipboard.writeText(payment.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusConfig = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'approved':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          text: 'Pagamento Aprovado',
          description: 'Seu pagamento foi confirmado com sucesso!',
        };
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          text: 'Aguardando Pagamento',
          description: 'Escaneie o QR Code ou copie o código PIX',
        };
      case 'rejected':
      case 'cancelled':
        return {
          icon: XCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          text: 'Pagamento Recusado',
          description: 'Houve um problema com seu pagamento',
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          text: 'Processando',
          description: 'Aguarde enquanto processamos seu pagamento',
        };
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {payment ? 'Pagamento' : 'Checkout'}
          </h1>
          <p className="text-gray-600 mt-2">
            {payment ? 'Finalize seu pagamento' : 'Configure sua assinatura'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Payment Status Card */}
        {payment && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            {/* Status header */}
            {(() => {
              const statusConfig = getStatusConfig(payment.status);
              const StatusIcon = statusConfig.icon;
              return (
                <div className={`flex items-center gap-4 p-4 rounded-xl ${statusConfig.bgColor} mb-6`}>
                  <StatusIcon className={`w-10 h-10 ${statusConfig.color}`} />
                  <div>
                    <h2 className={`text-lg font-semibold ${statusConfig.color}`}>
                      {statusConfig.text}
                    </h2>
                    <p className="text-gray-600 text-sm">{statusConfig.description}</p>
                  </div>
                </div>
              );
            })()}

            {/* PIX QR Code */}
            {payment.status === 'pending' && payment.pixQrCodeBase64 && (
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-2xl">
                  <img
                    src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48"
                  />
                </div>

                {/* Copia e cola */}
                {payment.pixCopiaECola && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Ou copie o código PIX:</p>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
                      <input
                        type="text"
                        value={payment.pixCopiaECola}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none truncate"
                      />
                      <button
                        onClick={copyPixCode}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        {copied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Expiration */}
                {payment.pixExpiresAt && (
                  <p className="text-sm text-gray-500 mt-4">
                    Expira em: {new Date(payment.pixExpiresAt).toLocaleString('pt-BR')}
                  </p>
                )}

                {/* Manual refresh button */}
                <button
                  onClick={checkPaymentStatus}
                  disabled={checkingStatus}
                  className="mt-4 flex items-center gap-2 mx-auto text-blue-600 hover:text-blue-700"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                  {checkingStatus ? 'Verificando...' : 'Verificar pagamento'}
                </button>
              </div>
            )}

            {/* Payment approved */}
            {payment.status === 'approved' && (
              <div className="text-center py-6">
                <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Pagamento Confirmado!
                </h3>
                <p className="text-gray-600 mb-6">
                  Sua assinatura foi ativada com sucesso.
                </p>
                <button
                  onClick={() => router.push('/admin')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Ir para o Painel
                </button>
              </div>
            )}

            {/* Payment details */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-3">Detalhes do Pagamento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor:</span>
                  <span className="font-medium">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Método:</span>
                  <span>{payment.paymentMethod === 'pix' ? 'PIX' : 'Cartão/Boleto'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">ID:</span>
                  <span className="font-mono text-xs">{payment.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New subscription form */}
        {!payment && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Configure sua Assinatura
            </h2>

            {/* Monitor count */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantidade de Monitores
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMonitorCount(Math.max(1, monitorCount - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                  {monitorCount}
                </span>
                <button
                  onClick={() => setMonitorCount(monitorCount + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formatCurrency(pricePerMonitor)} por monitor/mês
              </p>
            </div>

            {/* Payment method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    paymentMethod === 'pix'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCodeIcon className="w-6 h-6" />
                  <span className="font-medium">PIX</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('checkout_pro')}
                  className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                    paymentMethod === 'checkout_pro'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCardIcon className="w-6 h-6" />
                  <span className="font-medium">Cartão/Boleto</span>
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">
                  {monitorCount} monitor{monitorCount > 1 ? 'es' : ''} × {formatCurrency(pricePerMonitor)}
                </span>
                <span className="font-medium">{formatCurrency(monitorCount * pricePerMonitor)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                <span>Total mensal</span>
                <span className="text-blue-600">{formatCurrency(monitorCount * pricePerMonitor)}</span>
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={createPayment}
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  {paymentMethod === 'pix' ? <QrCodeIcon className="w-5 h-5" /> : <CreditCardIcon className="w-5 h-5" />}
                  {paymentMethod === 'pix' ? 'Gerar QR Code PIX' : 'Ir para Checkout'}
                </>
              )}
            </button>

            {/* Security note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Pagamento processado com segurança pelo MercadoPago
            </p>
          </div>
        )}

        {/* Back link */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Voltar para o painel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
