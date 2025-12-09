'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  DevicePhoneMobileIcon,
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
}

interface WhatsAppStatus {
  configured: boolean;
  status?: string;
  state?: string;
  message?: string;
  qrcode?: string;
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

  useEffect(() => {
    fetchSettings();
    fetchWhatsAppStatus();
  }, []);

  // Auto refresh QR code every 15 seconds when waiting for scan
  useEffect(() => {
    if (whatsappStatus?.status === 'QRCODE' || whatsappStatus?.state === 'QRCODE') {
      const interval = setInterval(() => {
        fetchQRCode();
        fetchWhatsAppStatus();
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [whatsappStatus]);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings({
        ...data,
        whatsapp: data.whatsapp || { notificationsEnabled: true }
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
      setWhatsappStatus(data);

      // If QR code status, fetch QR
      if (data.status === 'QRCODE' || data.state === 'QRCODE') {
        fetchQRCode();
      } else {
        setQrCode(null);
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
      if (data.qrcode) {
        setQrCode(data.qrcode);
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

      if (data.qrcode) {
        setQrCode(data.qrcode);
      }

      // Refresh status after starting
      setTimeout(() => {
        fetchWhatsAppStatus();
      }, 2000);
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
    if (whatsappStatus.state === 'CONNECTED' || whatsappStatus.status === 'CONNECTED') {
      return 'bg-green-100 text-green-700';
    }
    if (whatsappStatus.state === 'QRCODE' || whatsappStatus.status === 'QRCODE') {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-red-100 text-red-700';
  };

  const getStatusText = () => {
    if (!whatsappStatus?.configured) return 'Não Configurado';
    if (whatsappStatus.state === 'CONNECTED' || whatsappStatus.status === 'CONNECTED') {
      return 'Conectado';
    }
    if (whatsappStatus.state === 'QRCODE' || whatsappStatus.status === 'QRCODE') {
      return 'Aguardando QR Code';
    }
    if (whatsappStatus.state === 'STARTING' || whatsappStatus.status === 'STARTING') {
      return 'Iniciando...';
    }
    return whatsappStatus.state || whatsappStatus.status || 'Desconectado';
  };

  const isConnected = whatsappStatus?.state === 'CONNECTED' || whatsappStatus?.status === 'CONNECTED';

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
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

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

          {!whatsappStatus?.configured ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>WPP_SECRET_KEY</strong> não configurada no ambiente.
                Configure a variável para habilitar o WhatsApp.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* QR Code Area */}
              {(whatsappStatus.state === 'QRCODE' || whatsappStatus.status === 'QRCODE') && qrCode && (
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-4">
                    Escaneie o QR Code com seu WhatsApp
                  </p>
                  <div className="relative bg-white p-4 rounded-xl shadow-sm">
                    <img
                      src={qrCode}
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
