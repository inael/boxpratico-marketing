'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClockIcon } from '@heroicons/react/24/outline';

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('external_reference');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ClockIcon className="w-12 h-12 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento em Processamento
        </h1>

        <p className="text-gray-600 mb-6">
          Seu pagamento está sendo processado. Você receberá uma confirmação assim que for aprovado.
        </p>

        {paymentId && (
          <p className="text-sm text-gray-500 mb-6">
            ID do pagamento: <span className="font-mono">{paymentId}</span>
          </p>
        )}

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Boleto?</strong> Pagamentos via boleto podem levar até 3 dias úteis para serem confirmados.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/pagamento' + (paymentId ? `?payment=${paymentId}` : ''))}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Verificar Status
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Ir para o Painel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
