'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  DevicePhoneMobileIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Settings {
  rss: {
    url: string;
    imageTag: string;
    titleTag: string;
    descriptionTag: string;
  };
  auth: {
    username: string;
    password: string;
  };
  whatsapp: {
    notificationsEnabled: boolean;
  };
  evolution: {
    apiUrl: string;
    apiKey: string;
    instanceName: string;
  };
}

interface WhatsAppStatus {
  configured: boolean;
  status?: string;
  state?: string;
  message?: string;
  qrcode?: {
    base64?: string;
    code?: string;
  } | string;
}

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings>({
    rss: {
      url: '',
      imageTag: '',
      titleTag: '',
      descriptionTag: ''
    },
    auth: {
      username: '',
      password: ''
    },
    whatsapp: {
      notificationsEnabled: true
    },
    evolution: {
      apiUrl: '',
      apiKey: '',
      instanceName: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // WhatsApp states
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [refreshingQR, setRefreshingQR] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchWhatsAppStatus();
  }, []);

  // Auto refresh QR code every 15 seconds when waiting for scan
  // Evolution API uses 'qrcode' status, WPPConnect uses 'QRCODE'
  useEffect(() => {
    const needsQR = whatsappStatus?.status === 'QRCODE' ||
                    whatsappStatus?.state === 'QRCODE' ||
                    whatsappStatus?.status === 'qrcode' ||
                    whatsappStatus?.status === 'disconnected';
    if (needsQR && qrCode) {
      const interval = setInterval(() => {
        fetchQRCode();
        fetchWhatsAppStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [whatsappStatus, qrCode]);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings({
        ...data,
        whatsapp: data.whatsapp || { notificationsEnabled: true },
        evolution: data.evolution || { apiUrl: '', apiKey: '', instanceName: '' }
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWhatsAppStatus() {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();

      // Only update status if we're not currently showing a valid QR code
      // or if the new status is 'connected'
      const currentState = whatsappStatus?.state?.toLowerCase() || whatsappStatus?.status?.toLowerCase() || '';
      const newState = data.state?.toLowerCase() || data.status?.toLowerCase() || '';

      // If connected, clear QR code and update status
      if (newState === 'connected' || newState === 'open') {
        setQrCode(null);
        setWhatsappStatus(data);
        return;
      }

      // If we have a QR code showing and status is connecting, keep showing QR
      if (qrCode && currentState === 'qrcode' && newState === 'connecting') {
        // Don't update status, keep showing QR code
        return;
      }

      setWhatsappStatus(data);

      // If QR code status, fetch QR
      // Evolution API uses 'qrcode' or 'disconnected', WPPConnect uses 'QRCODE'
      const needsQR = data.status === 'QRCODE' ||
                      data.state === 'QRCODE' ||
                      data.status === 'qrcode' ||
                      data.status === 'disconnected';
      if (needsQR && !qrCode) {
        fetchQRCode();
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp status:', error);
    }
  }

  async function fetchQRCode() {
    setRefreshingQR(true);
    try {
      const res = await fetch('/api/whatsapp/qrcode');
      const data = await res.json();
      // Handle both Evolution API format (qrcode.base64) and WPPConnect format (qrcode as string)
      if (data.qrcode) {
        if (typeof data.qrcode === 'object' && data.qrcode.base64) {
          // Evolution API format - base64 already includes data:image prefix
          setQrCode(data.qrcode.base64);
        } else if (typeof data.qrcode === 'string') {
          // WPPConnect format
          setQrCode(data.qrcode);
        }
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
    } finally {
      setRefreshingQR(false);
    }
  }

  async function handleStartSession() {
    setWhatsappLoading(true);
    try {
      const res = await fetch('/api/whatsapp/start', { method: 'POST' });
      const data = await res.json();

      // Handle both Evolution API format and WPPConnect format
      if (data.qrcode) {
        if (typeof data.qrcode === 'object' && data.qrcode.base64) {
          setQrCode(data.qrcode.base64);
          // Set status to qrcode so the QR code is displayed
          setWhatsappStatus(prev => ({ ...prev, configured: true, status: 'qrcode', state: 'qrcode' }));
        } else if (typeof data.qrcode === 'string') {
          setQrCode(data.qrcode);
          setWhatsappStatus(prev => ({ ...prev, configured: true, status: 'qrcode', state: 'qrcode' }));
        }
      } else {
        // No QR code in response, refresh status
        setTimeout(() => {
          fetchWhatsAppStatus();
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to start WhatsApp session:', error);
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function handleLogout() {
    setWhatsappLoading(true);
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      setQrCode(null);
      setWhatsappStatus(null);

      // Refresh status
      setTimeout(() => {
        fetchWhatsAppStatus();
      }, 2000);
    } catch (error) {
      console.error('Failed to logout WhatsApp:', error);
    } finally {
      setWhatsappLoading(false);
    }
  }

  async function handleTestMessage() {
    const phone = prompt('Digite o número de telefone para teste (com DDD):');
    if (!phone) return;

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          message: '*BoxPrático Marketing*\n\nMensagem de teste enviada com sucesso!'
        })
      });

      const data = await res.json();
      if (data.status === 'success' || data.status === 'PENDING') {
        alert('Mensagem enviada com sucesso!');
      } else {
        alert('Erro ao enviar mensagem: ' + (data.message || 'Erro desconhecido'));
      }
    } catch (error) {
      alert('Erro ao enviar mensagem');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      } else {
        setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  }

  const getStatusColor = () => {
    if (!whatsappStatus?.configured) return 'bg-gray-100 text-gray-600';
    // Evolution API uses lowercase states: 'connected', 'disconnected', 'connecting'
    // WPPConnect uses uppercase: 'CONNECTED', 'QRCODE'
    const state = whatsappStatus.state?.toLowerCase() || whatsappStatus.status?.toLowerCase() || '';
    if (state === 'connected' || state === 'open') {
      return 'bg-green-100 text-green-700';
    }
    if (state === 'qrcode' || state === 'connecting') {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-red-100 text-red-700';
  };

  const getStatusText = () => {
    if (!whatsappStatus?.configured) return 'Não Configurado';
    const state = whatsappStatus.state?.toLowerCase() || whatsappStatus.status?.toLowerCase() || '';
    if (state === 'connected' || state === 'open') {
      return 'Conectado';
    }
    if (state === 'qrcode') {
      return 'Aguardando QR Code';
    }
    if (state === 'connecting' || state === 'starting') {
      return 'Conectando...';
    }
    if (state === 'disconnected' || state === 'close') {
      return 'Desconectado';
    }
    return whatsappStatus.state || whatsappStatus.status || 'Desconectado';
  };

  // Check for connected state (Evolution API uses 'connected'/'open', WPPConnect uses 'CONNECTED')
  const isConnected = (() => {
    const state = whatsappStatus?.state?.toLowerCase() || whatsappStatus?.status?.toLowerCase() || '';
    return state === 'connected' || state === 'open';
  })();

  // Check if QR code should be shown
  const showQRCode = (() => {
    const state = whatsappStatus?.state?.toLowerCase() || whatsappStatus?.status?.toLowerCase() || '';
    // Show QR code when we have one and status allows it
    return (state === 'qrcode' || state === 'disconnected' || state === 'close' || state === 'connecting') && qrCode;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* WhatsApp Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">
                  WhatsApp
                </h2>
                <p className="text-sm text-gray-500">
                  Conecte seu WhatsApp para receber notificações
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowInstructions(true)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                Como configurar?
              </button>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
          </div>

          {/* Instructions Modal */}
          {showInstructions && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
                  <h3 className="text-lg font-bold text-gray-900">
                    Como Integrar o WhatsApp com Evolution API
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Acesse o Evolution Manager</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Abra o painel de gerenciamento da Evolution API:
                      </p>
                      <a
                        href="https://whatsapp.toolpad.cloud/manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                      >
                        https://whatsapp.toolpad.cloud/manager
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Faça login com a API Key</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Na tela de login, insira a <strong>API Key Global</strong> da sua instância Evolution.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-xs text-yellow-800">
                          <strong>Dica:</strong> A API Key é a mesma configurada no <code className="bg-yellow-100 px-1 rounded">AUTHENTICATION_API_KEY</code> do seu servidor Evolution.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Crie uma nova instância</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        No painel, clique em <strong>&quot;+ Nova Instância&quot;</strong> e preencha:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-2 ml-4 list-disc">
                        <li><strong>Name:</strong> <code className="bg-gray-100 px-1 rounded">boxpratico</code> (nome da instância)</li>
                        <li><strong>Channel:</strong> Selecione <code className="bg-gray-100 px-1 rounded">WhatsApp Baileys</code></li>
                        <li><strong>Token:</strong> <span className="text-red-600">*Obrigatório</span> - Crie você mesmo um token seguro (será a API Key desta instância)</li>
                        <li><strong>Number:</strong> Deixe em branco (será vinculado ao escanear o QR Code)</li>
                      </ul>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-xs text-green-800">
                          <strong>Exemplo de Token:</strong> <code className="bg-green-100 px-1 rounded">boxpratico-api-2024</code> ou qualquer texto seguro que você queira usar.
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Clique em <strong>&quot;Criar&quot;</strong> ou <strong>&quot;Create&quot;</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Anote o Token que você criou</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        O Token que você definiu no passo anterior será usado como <strong>API Key</strong> para configurar aqui no BoxPrático.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Importante:</strong> O Token da instância (que você criou) é diferente da API Key Global (usada para login no Manager).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Step 5 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      5
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Configure aqui no BoxPrático</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Preencha os campos abaixo com as informações:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4 list-disc">
                        <li><strong>URL da API:</strong> <code className="bg-gray-100 px-1 rounded">https://whatsapp.toolpad.cloud</code></li>
                        <li><strong>API Key:</strong> O Token que você criou (ex: <code className="bg-gray-100 px-1 rounded">boxpratico-api-2024</code>)</li>
                        <li><strong>Nome da Instância:</strong> <code className="bg-gray-100 px-1 rounded">boxpratico</code> (mesmo nome usado no Manager)</li>
                      </ul>
                      <p className="text-sm text-gray-600 mt-2">
                        Clique em <strong>&quot;Salvar Configurações&quot;</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Step 6 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      6
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Conecte o WhatsApp</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Clique no botão <strong>&quot;Conectar WhatsApp&quot;</strong> abaixo. Um QR Code será exibido.
                      </p>
                      <p className="text-sm text-gray-600">
                        No seu celular, abra o <strong>WhatsApp</strong> → <strong>Configurações</strong> → <strong>Dispositivos Conectados</strong> → <strong>Conectar Dispositivo</strong> e escaneie o QR Code.
                      </p>
                    </div>
                  </div>

                  {/* Step 7 */}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                      7
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Pronto!</h4>
                      <p className="text-sm text-gray-600">
                        Após escanear, o status mudará para <span className="text-green-600 font-semibold">Conectado</span>.
                        Você pode testar enviando uma mensagem de teste.
                      </p>
                    </div>
                  </div>

                  {/* Links úteis */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Links Úteis</h4>
                    <div className="space-y-2">
                      <a
                        href="https://whatsapp.toolpad.cloud/manager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                      >
                        <span>Evolution Manager</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                      <a
                        href="https://doc.evolution-api.com/v2/pt/get-started/introduction"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                      >
                        <span>Documentação Evolution API</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => setShowInstructions(false)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Entendi, vamos configurar!
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Notifications Toggle */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-gray-900">Notificações Automáticas</span>
                <p className="text-sm text-gray-500">
                  Receba alertas sobre campanhas, monitores e mídias via WhatsApp
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.whatsapp?.notificationsEnabled ?? true}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp: { ...settings.whatsapp, notificationsEnabled: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </div>
            </label>
          </div>

          {/* Notifications Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tipos de Notificações Enviadas
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              As mensagens são enviadas para o <strong>número de WhatsApp cadastrado em cada condomínio</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-blue-800"><strong>Condomínio cadastrado</strong> - Confirmação de cadastro</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">🎯</span>
                <span className="text-blue-800"><strong>Campanha criada</strong> - Nova campanha ativa</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">📝</span>
                <span className="text-blue-800"><strong>Campanha atualizada</strong> - Alterações na campanha</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600">⚠️</span>
                <span className="text-blue-800"><strong>Campanha expirada</strong> - Fim do período</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-600">📸</span>
                <span className="text-blue-800"><strong>Mídia adicionada</strong> - Nova mídia no sistema</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">🗑️</span>
                <span className="text-blue-800"><strong>Mídia removida</strong> - Mídia excluída</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-600">📺</span>
                <span className="text-blue-800"><strong>Monitor cadastrado</strong> - Novo monitor</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">🟢</span>
                <span className="text-blue-800"><strong>Monitor online</strong> - Funcionando</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">🔴</span>
                <span className="text-blue-800"><strong>Monitor offline</strong> - Sem resposta</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              💡 <strong>Dica:</strong> Certifique-se de cadastrar o número de WhatsApp ao criar cada condomínio para receber as notificações.
            </p>
          </div>

          {/* Evolution API Configuration */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Configuração da Evolution API</h3>
            <p className="text-xs text-gray-500 mb-4">
              Configure os campos abaixo para sobrescrever as variáveis de ambiente. Deixe em branco para usar os valores padrão.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL da API
                </label>
                <input
                  type="url"
                  value={settings.evolution?.apiUrl || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    evolution: { ...settings.evolution, apiUrl: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 text-sm"
                  placeholder="https://whatsapp.toolpad.cloud"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={settings.evolution?.apiKey || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    evolution: { ...settings.evolution, apiKey: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 text-sm"
                  placeholder="Sua API Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Instância
                </label>
                <input
                  type="text"
                  value={settings.evolution?.instanceName || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    evolution: { ...settings.evolution, instanceName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 text-sm"
                  placeholder="boxpratico"
                />
              </div>
            </div>
          </div>

          {!whatsappStatus?.configured ? (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Evolution API</strong> não configurada. Configure acima ou defina EVOLUTION_API_KEY no ambiente.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code Area */}
              {showQRCode && (
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-4">
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                  <div className="relative bg-white p-4 rounded-xl shadow-sm">
                    <img
                      src={qrCode || undefined}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64"
                    />
                    {refreshingQR && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      fetchQRCode();
                      fetchWhatsAppStatus();
                    }}
                    className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Atualizar QR Code
                  </button>
                </div>
              )}

              {/* Connected Status */}
              {isConnected && (
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">WhatsApp Conectado</p>
                    <p className="text-sm text-green-700">
                      Pronto para enviar notificações
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!isConnected && (
                  <button
                    type="button"
                    onClick={handleStartSession}
                    disabled={whatsappLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {whatsappLoading ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <DevicePhoneMobileIcon className="w-5 h-5" />
                    )}
                    {whatsappLoading ? 'Iniciando...' : 'Conectar WhatsApp'}
                  </button>
                )}

                {isConnected && (
                  <>
                    <button
                      type="button"
                      onClick={handleTestMessage}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                    >
                      Enviar Teste
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={whatsappLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      {whatsappLoading ? (
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      ) : (
                        <XCircleIcon className="w-5 h-5" />
                      )}
                      Desconectar
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={fetchWhatsAppStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  <ArrowPathIcon className="w-5 h-5" />
                  Atualizar Status
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RSS Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
            Configurações de RSS
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                URL do Feed RSS
              </label>
              <input
                type="url"
                value={settings.rss.url}
                onChange={(e) => setSettings({
                  ...settings,
                  rss: { ...settings.rss, url: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                placeholder="https://exemplo.com/feed.xml"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Mapeamento de Tags XML
              </p>
              <p className="text-xs text-blue-700">
                Preencha apenas o nome da tag XML (sem os símbolos &lt; e &gt;).
                Para tags aninhadas, use ponto (.). Exemplo: <code className="bg-blue-100 px-1 rounded">enclosure.url</code>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tag da Imagem
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&lt;</span>
                  <input
                    type="text"
                    value={settings.rss.imageTag}
                    onChange={(e) => setSettings({
                      ...settings,
                      rss: { ...settings.rss, imageTag: e.target.value }
                    })}
                    className="w-full pl-7 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    placeholder="enclosure.url"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&gt;</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tag do Título
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&lt;</span>
                  <input
                    type="text"
                    value={settings.rss.titleTag}
                    onChange={(e) => setSettings({
                      ...settings,
                      rss: { ...settings.rss, titleTag: e.target.value }
                    })}
                    className="w-full pl-7 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    placeholder="title"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&gt;</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tag do Resumo
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&lt;</span>
                  <input
                    type="text"
                    value={settings.rss.descriptionTag}
                    onChange={(e) => setSettings({
                      ...settings,
                      rss: { ...settings.rss, descriptionTag: e.target.value }
                    })}
                    className="w-full pl-7 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                    placeholder="description"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&gt;</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Configuration */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-display font-bold text-gray-900 mb-4">
            Credenciais de Administrador
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={settings.auth.username}
                onChange={(e) => setSettings({
                  ...settings,
                  auth: { ...settings.auth, username: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                placeholder="admin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={settings.auth.password}
                onChange={(e) => setSettings({
                  ...settings,
                  auth: { ...settings.auth, password: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F59E0B] focus:border-[#F59E0B] outline-none text-gray-900"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Ao alterar as credenciais, você precisará fazer login novamente.
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
