'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface FormData {
  code: string;
  ownerName: string;
  email: string;
  phone: string;
  companyName: string;
  trialDays: number;
  monitorName: string;
}

function AtivarContent() {
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get('code') || '';

  const [mode, setMode] = useState<'code' | 'login' | 'trial'>('code');
  const [formData, setFormData] = useState<FormData>({
    code: codeFromUrl,
    ownerName: '',
    email: '',
    phone: '',
    companyName: '',
    trialDays: 7,
    monitorName: 'Terminal Principal',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);

  // Verificar código quando mudar
  useEffect(() => {
    const checkCode = async () => {
      if (formData.code.length >= 7) { // ABC-1234 = 8 caracteres
        try {
          const response = await fetch(`/api/activation?code=${formData.code}`);
          const data = await response.json();
          setCodeValid(data.valid);
          if (!data.valid && data.code?.status === 'activated') {
            setError('Este código já foi utilizado');
          } else if (!data.valid) {
            setError('Código inválido ou expirado');
          } else {
            setError('');
          }
        } catch {
          setCodeValid(null);
        }
      } else {
        setCodeValid(null);
        setError('');
      }
    };

    const debounce = setTimeout(checkCode, 500);
    return () => clearTimeout(debounce);
  }, [formData.code]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    // Formatar como ABC-1234
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7);
    }
    setFormData(prev => ({ ...prev, code: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'trial') {
        // Criar conta trial e ativar
        const response = await fetch('/api/activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code,
            createTrial: true,
            trialData: {
              name: formData.companyName,
              ownerName: formData.ownerName,
              email: formData.email,
              phone: formData.phone,
              trialDays: formData.trialDays,
            },
            monitorName: formData.monitorName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao ativar');
        }

        setIsSuccess(true);
      } else if (mode === 'login') {
        // Login com conta existente
        const accountResponse = await fetch(`/api/accounts?email=${formData.email}`);

        if (!accountResponse.ok) {
          throw new Error('Conta não encontrada. Crie uma conta de teste.');
        }

        const account = await accountResponse.json();

        // Ativar com conta existente
        const response = await fetch('/api/activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code,
            accountId: account.id,
            monitorName: formData.monitorName,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao ativar');
        }

        setIsSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar terminal');
    } finally {
      setIsLoading(false);
    }
  };

  // Tela de sucesso
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-7xl mb-6"
          >
            🎉
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Terminal Ativado!
          </h1>
          <p className="text-gray-600 mb-6">
            Seu terminal foi configurado com sucesso. A tela da TV irá atualizar automaticamente.
          </p>
          <div className="bg-green-50 rounded-xl p-4 text-green-800">
            <p className="font-medium">Próximos passos:</p>
            <ol className="text-left text-sm mt-2 space-y-1">
              <li>1. Acesse o painel admin</li>
              <li>2. Configure suas mídias</li>
              <li>3. Crie sua primeira playlist</li>
            </ol>
          </div>
          <a
            href="/admin"
            className="mt-6 inline-block w-full py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-xl font-semibold"
          >
            Ir para o Painel
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            <span className="text-[#F59E0B]">Box</span>Prático
          </h1>
          <p className="text-gray-500 text-sm">Ativar Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo do código */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Código de Ativação
            </label>
            <div className="relative">
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleCodeInput}
                placeholder="ABC-1234"
                maxLength={8}
                className={`w-full px-4 py-3 text-2xl font-mono font-bold text-center border-2 rounded-xl outline-none transition-colors ${
                  codeValid === true
                    ? 'border-green-500 bg-green-50'
                    : codeValid === false
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-[#F59E0B]'
                }`}
              />
              {codeValid !== null && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {codeValid ? (
                    <span className="text-green-500 text-2xl">✓</span>
                  ) : (
                    <span className="text-red-500 text-2xl">✗</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Digite o código exibido na TV
            </p>
          </div>

          {/* Seleção de modo */}
          {codeValid && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
            >
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setMode('trial')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'trial'
                      ? 'bg-[#F59E0B] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Teste Grátis
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'login'
                      ? 'bg-[#F59E0B] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Já tenho conta
                </button>
              </div>

              <AnimatePresence mode="wait">
                {mode === 'trial' ? (
                  <motion.div
                    key="trial"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      name="ownerName"
                      value={formData.ownerName}
                      onChange={handleInputChange}
                      placeholder="Seu nome"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Seu email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="WhatsApp (opcional)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Nome da empresa/condomínio"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Período de teste
                      </label>
                      <select
                        name="trialDays"
                        value={formData.trialDays}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                      >
                        <option value={7}>7 dias (recomendado)</option>
                        <option value={14}>14 dias</option>
                        <option value={30}>30 dias</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      name="monitorName"
                      value={formData.monitorName}
                      onChange={handleInputChange}
                      placeholder="Nome do terminal (ex: Portaria)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email da conta"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                    <input
                      type="text"
                      name="monitorName"
                      value={formData.monitorName}
                      onChange={handleInputChange}
                      placeholder="Nome do terminal (ex: Portaria)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Erro */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Botão de submit */}
          {codeValid && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              type="submit"
              disabled={isLoading || !codeValid}
              className="w-full py-4 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Ativando...
                </>
              ) : (
                mode === 'trial' ? 'Começar Teste Grátis' : 'Ativar Terminal'
              )}
            </motion.button>
          )}
        </form>

        {/* Termos */}
        {mode === 'trial' && codeValid && (
          <p className="text-xs text-gray-500 text-center mt-4">
            Ao continuar, você aceita nossos{' '}
            <a href="#" className="text-[#F59E0B]">Termos de Uso</a> e{' '}
            <a href="#" className="text-[#F59E0B]">Política de Privacidade</a>
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default function AtivarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    }>
      <AtivarContent />
    </Suspense>
  );
}
