'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id') || searchParams.get('external_reference');

  useEffect(() => {
    // Redirect to admin after 5 seconds
    const timer = setTimeout(() => {
      router.push('/admin');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h1>

        <p className="text-gray-600 mb-6">
          Seu pagamento foi processado com sucesso. Sua assinatura já está ativa.
        </p>

        {paymentId && (
          <p className="text-sm text-gray-500 mb-6">
            ID do pagamento: <span className="font-mono">{paymentId}</span>
          </p>
        )}

        <button
          onClick={() => router.push('/admin')}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          Ir para o Painel
        </button>

        <p className="text-sm text-gray-500 mt-4">
          Você será redirecionado automaticamente...
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
