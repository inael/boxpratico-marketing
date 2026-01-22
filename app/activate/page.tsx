'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'qrcode';

interface ActivationCode {
  id: string;
  code: string;
  deviceId: string;
  expiresAt: string;
  status: string;
  monitorId?: string;
}

// Gerar um deviceId único baseado no navegador
function generateDeviceId(): string {
  // Tentar recuperar do localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('boxpratico_device_id');
    if (stored) return stored;

    // Gerar novo ID
    const newId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('boxpratico_device_id', newId);
    return newId;
  }
  return `device_${Date.now()}`;
}

export default function ActivatePage() {
  const [activationCode, setActivationCode] = useState<ActivationCode | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivated, setIsActivated] = useState(false);
  const [activatedMonitorSlug, setActivatedMonitorSlug] = useState<string>('');

  // Buscar ou criar código de ativação
  const fetchActivationCode = useCallback(async () => {
    try {
      const deviceId = generateDeviceId();
      const response = await fetch(`/api/activation?deviceId=${deviceId}`);
      const data = await response.json();

      if (data.status === 'activated' && data.code) {
        setIsActivated(true);
        // Buscar slug do monitor para redirecionar
        if (data.code.monitorId) {
          const monitorRes = await fetch(`/api/monitors/${data.code.monitorId}`);
          if (monitorRes.ok) {
            const monitor = await monitorRes.json();
            setActivatedMonitorSlug(monitor.slug);
          }
        }
        return;
      }

      if (data.code) {
        setActivationCode(data.code);

        // Gerar QR Code
        const activationUrl = `${window.location.origin}/ativar?code=${data.code.code}`;
        const qrDataUrl = await QRCode.toDataURL(activationUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setQrCodeDataUrl(qrDataUrl);

        // Calcular tempo restante
        const expiresAt = new Date(data.code.expiresAt);
        const now = new Date();
        const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        setTimeLeft(diff);
      }
    } catch (error) {
      console.error('Error fetching activation code:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verificar status periodicamente
  useEffect(() => {
    fetchActivationCode();

    // Verificar a cada 5 segundos se foi ativado
    const checkInterval = setInterval(async () => {
      const deviceId = generateDeviceId();
      try {
        const response = await fetch(`/api/activation?deviceId=${deviceId}`);
        const data = await response.json();

        if (data.status === 'activated') {
          setIsActivated(true);
          if (data.code?.monitorId) {
            const monitorRes = await fetch(`/api/monitors/${data.code.monitorId}`);
            if (monitorRes.ok) {
              const monitor = await monitorRes.json();
              setActivatedMonitorSlug(monitor.slug);
            }
          }
        }
      } catch (error) {
        console.error('Error checking activation status:', error);
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [fetchActivationCode]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 || isActivated) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Código expirou, buscar novo
          fetchActivationCode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isActivated, fetchActivationCode]);

  // Redirecionar após ativação
  useEffect(() => {
    if (isActivated && activatedMonitorSlug) {
      const timer = setTimeout(() => {
        window.location.href = `/monitor/${activatedMonitorSlug}`;
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isActivated, activatedMonitorSlug]);

  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Formatar código com espaçamento visual
  const formatCode = (code: string) => {
    return code; // Já vem formatado como ABC-1234
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white text-2xl"
        >
          Carregando...
        </motion.div>
      </div>
    );
  }

  // Tela de ativado
  if (isActivated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-black flex items-center justify-center p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="text-9xl mb-8"
          >
            ✅
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Terminal Ativado!
          </h1>
          <p className="text-2xl text-green-200 mb-8">
            Seu terminal foi configurado com sucesso
          </p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-green-300"
          >
            Redirecionando para o player...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Logo e título */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white mb-2">
            <span className="text-[#F59E0B]">Box</span>Prático
          </h1>
          <p className="text-xl text-gray-400">Marketing Digital</p>
        </motion.div>

        {/* Card de ativação */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Ative seu Terminal
          </h2>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* QR Code */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center"
            >
              <div className="bg-white p-4 rounded-2xl shadow-xl mb-4">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code de Ativação"
                    className="w-64 h-64"
                  />
                ) : (
                  <div className="w-64 h-64 bg-gray-200 animate-pulse rounded" />
                )}
              </div>
              <p className="text-gray-400 text-center">
                Escaneie o QR Code com seu celular
              </p>
            </motion.div>

            {/* Código e instruções */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center md:text-left"
            >
              <p className="text-gray-300 mb-4 text-lg">
                Ou acesse:
              </p>

              <div className="bg-black/30 rounded-xl p-4 mb-6">
                <p className="text-[#F59E0B] text-2xl font-mono font-bold">
                  boxpratico.com.br/ativar
                </p>
              </div>

              <p className="text-gray-300 mb-4 text-lg">
                E digite o código:
              </p>

              <div className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] rounded-xl p-6 mb-6">
                <p className="text-5xl font-mono font-bold text-white tracking-wider text-center">
                  {activationCode ? formatCode(activationCode.code) : '---'}
                </p>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  Código expira em{' '}
                  <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Rodapé */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-gray-500"
        >
          <p>Precisa de ajuda? Acesse nosso suporte em</p>
          <p className="text-[#F59E0B]">suporte.boxpratico.com.br</p>
        </motion.div>
      </div>
    </div>
  );
}
