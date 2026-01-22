'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircleIcon } from '@heroicons/react/24/outline';

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircleIcon className="w-12 h-12 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento não Aprovado
        </h1>

        <p className="text-gray-600 mb-6">
          {errorMessage || 'Houve um problema ao processar seu pagamento. Por favor, tente novamente.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/pagamento')}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>

          <button
            onClick={() => router.push('/admin')}
            className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Voltar para o Painel
          </button>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}
