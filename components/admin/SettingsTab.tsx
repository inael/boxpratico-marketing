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
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ChevronDownIcon,
  RssIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';
import {
  SystemPricingConfig,
  DEFAULT_PRICING_CONFIG,
  VolumeDiscount,
  MedalConfig,
  MedalTier,
  DEFAULT_MEDAL_CONFIG,
  MedalType,
} from '@/types';

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
    managerUrl: string;
  };
  networkPricing: {
    pricePerDisplayMonth: number;
    insertionsPerHour: number;
    avgInsertionDurationSeconds: number;
    operatingHoursPerDay: number;
  };
  systemPricing?: SystemPricingConfig;
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
      instanceName: '',
      managerUrl: ''
    },
    networkPricing: {
      pricePerDisplayMonth: 20,
      insertionsPerHour: 4,
      avgInsertionDurationSeconds: 15,
      operatingHoursPerDay: 12
    },
    systemPricing: DEFAULT_PRICING_CONFIG
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

  // Medal config states
  const [medalConfig, setMedalConfig] = useState<MedalConfig>(DEFAULT_MEDAL_CONFIG);
  const [savingMedals, setSavingMedals] = useState(false);

  // Collapsible sections state - all collapsed by default
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    whatsapp: false,
    networkPricing: false,
    systemPricing: false,
    rss: false,
    auth: false,
    medals: false,
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchWhatsAppStatus();
    fetchMedalConfig();
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
        evolution: data.evolution || { apiUrl: '', apiKey: '', instanceName: '', managerUrl: '' },
        networkPricing: data.networkPricing || {
          pricePerDisplayMonth: 20,
          insertionsPerHour: 4,
          avgInsertionDurationSeconds: 15,
          operatingHoursPerDay: 12
        },
        systemPricing: data.systemPricing || DEFAULT_PRICING_CONFIG
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMedalConfig() {
    try {
      const res = await fetch('/api/settings/medals');
      if (res.ok) {
        const data = await res.json();
        setMedalConfig(data);
      }
    } catch (error) {
      console.error('Failed to fetch medal config:', error);
    }
  }

  async function saveMedalConfig() {
    setSavingMedals(true);
    try {
      const res = await fetch('/api/settings/medals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(medalConfig),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Configuração de medalhas salva!' });
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Erro ao salvar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar configuração de medalhas' });
    } finally {
      setSavingMedals(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function updateMedalTier(index: number, field: keyof MedalTier, value: string | number) {
    const newTiers = [...medalConfig.tiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]: value,
    };
    setMedalConfig({ ...medalConfig, tiers: newTiers });
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('whatsapp')}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                  WhatsApp
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Conecte seu WhatsApp para receber notificações
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  expandedSections.whatsapp ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {expandedSections.whatsapp && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 mb-4">
              {/* Quick access to Evolution Manager */}
              {(settings.evolution?.managerUrl || settings.evolution?.apiUrl) && (
                <a
                  href={settings.evolution?.managerUrl || `${settings.evolution?.apiUrl}/manager`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Evolution Manager
                </a>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowInstructions(true); }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                Como configurar?
              </button>
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
                  Receba alertas sobre playlists, telas e mídias via WhatsApp
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
              As mensagens são enviadas para o <strong>número de WhatsApp cadastrado em cada local</strong>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-blue-800"><strong>Local cadastrado</strong> - Confirmação de cadastro</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600">🎯</span>
                <span className="text-blue-800"><strong>Playlist criada</strong> - Nova playlist ativa</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-600">📝</span>
                <span className="text-blue-800"><strong>Playlist atualizada</strong> - Alterações na playlist</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-600">⚠️</span>
                <span className="text-blue-800"><strong>Playlist expirada</strong> - Fim do período</span>
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
                <span className="text-blue-800"><strong>Tela cadastrada</strong> - Nova tela</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600">🟢</span>
                <span className="text-blue-800"><strong>Tela online</strong> - Funcionando</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-600">🔴</span>
                <span className="text-blue-800"><strong>Tela offline</strong> - Sem resposta</span>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              💡 <strong>Dica:</strong> Certifique-se de cadastrar o número de WhatsApp ao criar cada local para receber as notificações.
            </p>
          </div>

          {/* Evolution API Configuration */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Configuração da Evolution API</h3>
            <p className="text-xs text-gray-500 mb-4">
              Configure os campos abaixo para sobrescrever as variáveis de ambiente. Deixe em branco para usar os valores padrão.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                  URL do Manager
                  <span className="text-xs text-gray-400 ml-1">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={settings.evolution?.managerUrl || ''}
                  onChange={(e) => setSettings({
                    ...settings,
                    evolution: { ...settings.evolution, managerUrl: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900 text-sm"
                  placeholder="https://whatsapp.toolpad.cloud/manager"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          )}
        </div>

        {/* Network Pricing Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('networkPricing')}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CurrencyDollarIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                  Precos da Rede
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Configure os precos e parametros para calculo de orcamento
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedSections.networkPricing ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.networkPricing && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Preco por Display (R$/mes)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.networkPricing?.pricePerDisplayMonth || 20}
                onChange={(e) => setSettings({
                  ...settings,
                  networkPricing: { ...settings.networkPricing, pricePerDisplayMonth: parseFloat(e.target.value) || 0 }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                placeholder="20.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Valor base cobrado por cada tela/display por mes
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Insercoes por Hora
              </label>
              <input
                type="number"
                min="1"
                value={settings.networkPricing?.insertionsPerHour || 4}
                onChange={(e) => setSettings({
                  ...settings,
                  networkPricing: { ...settings.networkPricing, insertionsPerHour: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                placeholder="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                Quantas vezes o anuncio aparece por hora em cada tela
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Duracao Media da Insercao (segundos)
              </label>
              <input
                type="number"
                min="5"
                value={settings.networkPricing?.avgInsertionDurationSeconds || 15}
                onChange={(e) => setSettings({
                  ...settings,
                  networkPricing: { ...settings.networkPricing, avgInsertionDurationSeconds: parseInt(e.target.value) || 5 }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                placeholder="15"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tempo medio de exibicao de cada insercao
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Horas de Funcionamento por Dia
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.networkPricing?.operatingHoursPerDay || 12}
                onChange={(e) => setSettings({
                  ...settings,
                  networkPricing: { ...settings.networkPricing, operatingHoursPerDay: parseInt(e.target.value) || 1 }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                placeholder="12"
              />
              <p className="text-xs text-gray-500 mt-1">
                Media de horas que as telas ficam ligadas por dia
              </p>
            </div>
          </div>

          {/* Preview dos calculos */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-amber-900 mb-2">Previa de Calculo (por display/mes)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-amber-700">Insercoes/dia</p>
                <p className="font-bold text-amber-900">
                  {((settings.networkPricing?.insertionsPerHour || 4) * (settings.networkPricing?.operatingHoursPerDay || 12)).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-amber-700">Insercoes/mes</p>
                <p className="font-bold text-amber-900">
                  {((settings.networkPricing?.insertionsPerHour || 4) * (settings.networkPricing?.operatingHoursPerDay || 12) * 30).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-amber-700">Tempo/dia</p>
                <p className="font-bold text-amber-900">
                  {Math.round((settings.networkPricing?.insertionsPerHour || 4) * (settings.networkPricing?.operatingHoursPerDay || 12) * (settings.networkPricing?.avgInsertionDurationSeconds || 15) / 60)} min
                </p>
              </div>
              <div>
                <p className="text-amber-700">Preco</p>
                <p className="font-bold text-amber-900">
                  R$ {(settings.networkPricing?.pricePerDisplayMonth || 20).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
          </div>
          )}
        </div>

        {/* System Pricing Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('systemPricing')}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <BuildingStorefrontIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                  Precos do Sistema
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Configuracao de precos para operadores e anunciantes
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedSections.systemPricing ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.systemPricing && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 pt-4">
          {/* Operadores (Whitelabel) */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5 text-green-600" />
              Operadores (Whitelabel)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preco por Monitor (R$/mes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.systemPricing?.operatorPricePerMonitor || 35}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemPricing: {
                      ...settings.systemPricing!,
                      operatorPricePerMonitor: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
                  placeholder="35.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Valor cobrado por cada monitor ativo
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Comissao da Plataforma (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.systemPricing?.platformCommissionPercent || 20}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemPricing: {
                      ...settings.systemPricing!,
                      platformCommissionPercent: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-900"
                  placeholder="20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  % sobre receita que operadores geram com anunciantes
                </p>
              </div>
            </div>
          </div>

          {/* Anunciantes */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
              Anunciantes
            </h3>
            <div className="p-4 bg-blue-50 rounded-xl space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Preco Base por Tela (R$/mes)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={settings.systemPricing?.advertiserBasePricePerScreen || 35}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemPricing: {
                      ...settings.systemPricing!,
                      advertiserBasePricePerScreen: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
                  placeholder="35.00"
                />
              </div>

              {/* Faixas de desconto por volume */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descontos por Volume de Telas
                </label>
                <div className="space-y-2">
                  {(settings.systemPricing?.volumeDiscounts || DEFAULT_PRICING_CONFIG.volumeDiscounts).map((discount, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 items-center">
                      <div className="text-sm text-gray-600">
                        {discount.minScreens}-{discount.maxScreens === 999 ? '+' : discount.maxScreens} telas
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount.pricePerScreen}
                        onChange={(e) => {
                          const newDiscounts = [...(settings.systemPricing?.volumeDiscounts || DEFAULT_PRICING_CONFIG.volumeDiscounts)];
                          newDiscounts[index] = {
                            ...newDiscounts[index],
                            pricePerScreen: parseFloat(e.target.value) || 0
                          };
                          setSettings({
                            ...settings,
                            systemPricing: {
                              ...settings.systemPricing!,
                              volumeDiscounts: newDiscounts
                            }
                          });
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="R$/tela"
                      />
                      <div className="text-sm text-gray-500">
                        R$/tela
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        {discount.discountPercent > 0 ? `-${discount.discountPercent}%` : 'Base'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multiplicadores Premium */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Multiplicadores Premium
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Alto Trafego (x)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.systemPricing?.premiumMultipliers?.highTraffic || 1.5}
                      onChange={(e) => setSettings({
                        ...settings,
                        systemPricing: {
                          ...settings.systemPricing!,
                          premiumMultipliers: {
                            ...settings.systemPricing!.premiumMultipliers,
                            highTraffic: parseFloat(e.target.value) || 1
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Local Premium (x)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.systemPricing?.premiumMultipliers?.premiumLocation || 1.3}
                      onChange={(e) => setSettings({
                        ...settings,
                        systemPricing: {
                          ...settings.systemPricing!,
                          premiumMultipliers: {
                            ...settings.systemPricing!.premiumMultipliers,
                            premiumLocation: parseFloat(e.target.value) || 1
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Horario Nobre (x)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      value={settings.systemPricing?.premiumMultipliers?.primeTime || 1.2}
                      onChange={(e) => setSettings({
                        ...settings,
                        systemPricing: {
                          ...settings.systemPricing!,
                          premiumMultipliers: {
                            ...settings.systemPricing!.premiumMultipliers,
                            primeTime: parseFloat(e.target.value) || 1
                          }
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trial */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Periodo de Teste</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dias Padrao
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={settings.systemPricing?.trialDaysDefault || 7}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemPricing: {
                      ...settings.systemPricing!,
                      trialDaysDefault: parseInt(e.target.value) || 7
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Dias Maximo
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.systemPricing?.trialDaysMax || 30}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemPricing: {
                      ...settings.systemPricing!,
                      trialDaysMax: parseInt(e.target.value) || 30
                    }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Pagamento */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Metodos de Pagamento</h3>
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Taxa do Gateway (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={settings.systemPricing?.paymentGatewayFeePercent || 5}
                  onChange={(e) => setSettings({
                    ...settings,
                    systemPricing: {
                      ...settings.systemPricing!,
                      paymentGatewayFeePercent: parseFloat(e.target.value) || 0
                    }
                  })}
                  className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 outline-none text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Taxa cobrada pelo MercadoPago (~5%)
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.systemPricing?.paymentMethods?.pix ?? true}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemPricing: {
                        ...settings.systemPricing!,
                        paymentMethods: {
                          ...settings.systemPricing!.paymentMethods,
                          pix: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">PIX</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.systemPricing?.paymentMethods?.creditCard ?? true}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemPricing: {
                        ...settings.systemPricing!,
                        paymentMethods: {
                          ...settings.systemPricing!.paymentMethods,
                          creditCard: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Cartao de Credito</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.systemPricing?.paymentMethods?.boleto ?? true}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemPricing: {
                        ...settings.systemPricing!,
                        paymentMethods: {
                          ...settings.systemPricing!.paymentMethods,
                          boleto: e.target.checked
                        }
                      }
                    })}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Boleto</span>
                </label>
              </div>
            </div>
          </div>
          </div>
          )}
        </div>

        {/* RSS Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('rss')}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <RssIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                  Configurações de RSS
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Configure feeds RSS para importar conteúdo
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedSections.rss ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.rss && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 pt-4">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                    className="w-full pl-7 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                    className="w-full pl-7 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                    className="w-full pl-7 pr-7 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                    placeholder="description"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">&gt;</span>
                </div>
              </div>
            </div>
          </div>
          </div>
          )}
        </div>

        {/* Auth Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('auth')}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <LockClosedIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                  Credenciais de Administrador
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Configure usuário e senha do administrador
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedSections.auth ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.auth && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 pt-4">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
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
          )}
        </div>

        {/* Medal Configuration */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('medals')}
            className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🏅</span>
              </div>
              <div className="text-left">
                <h2 className="text-lg sm:text-xl font-display font-bold text-gray-900">
                  Classificação de Pontos (Medalhas)
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  Configure as faixas de fluxo de pessoas para classificar os pontos
                </p>
              </div>
            </div>
            <ChevronDownIcon
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                expandedSections.medals ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.medals && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-100 pt-4">
          {/* Enable/Disable */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={medalConfig.enabled}
                onChange={(e) => setMedalConfig({ ...medalConfig, enabled: e.target.checked })}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Habilitar sistema de medalhas
              </span>
            </label>
          </div>

          {medalConfig.enabled && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Defina as faixas de fluxo diário de pessoas para cada nível de medalha.
                O multiplicador de preço é aplicado ao valor base por tela.
              </p>

              <div className="space-y-4">
                {medalConfig.tiers.map((tier, index) => (
                  <div
                    key={tier.type}
                    className="flex flex-wrap items-center gap-4 p-4 rounded-lg border border-gray-200"
                    style={{ backgroundColor: `${tier.color}10` }}
                  >
                    {/* Icon and Label */}
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <span className="text-2xl">{tier.icon}</span>
                      <span className="font-bold text-gray-900">{tier.label}</span>
                    </div>

                    {/* Min Traffic */}
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Fluxo Mínimo (pessoas/dia)
                      </label>
                      <input
                        type="number"
                        value={tier.minTraffic}
                        onChange={(e) => updateMedalTier(index, 'minTraffic', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                        min="0"
                      />
                    </div>

                    {/* Max Traffic */}
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Fluxo Máximo (pessoas/dia)
                      </label>
                      <input
                        type="number"
                        value={tier.maxTraffic === 999999 ? '' : tier.maxTraffic}
                        onChange={(e) => updateMedalTier(index, 'maxTraffic', parseInt(e.target.value) || 999999)}
                        placeholder="Ilimitado"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                        min="0"
                      />
                    </div>

                    {/* Price Multiplier */}
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Multiplicador de Preço
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={tier.priceMultiplier}
                          onChange={(e) => updateMedalTier(index, 'priceMultiplier', parseFloat(e.target.value) || 1)}
                          step="0.1"
                          min="0.1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">x</span>
                      </div>
                    </div>

                    {/* Color Picker */}
                    <div className="min-w-[80px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Cor
                      </label>
                      <input
                        type="color"
                        value={tier.color}
                        onChange={(e) => updateMedalTier(index, 'color', e.target.value)}
                        className="w-full h-10 rounded-lg cursor-pointer border border-gray-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Info about price */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Exemplo:</strong> Se o preço base por tela for R$ 35 e o ponto tiver fluxo de 350 pessoas/dia (Ouro com multiplicador 2x),
                  o valor da tela será R$ 70/mês.
                </p>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={saveMedalConfig}
                  disabled={savingMedals}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {savingMedals ? 'Salvando...' : 'Salvar Medalhas'}
                </button>
              </div>
            </div>
          )}
          </div>
          )}
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
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
