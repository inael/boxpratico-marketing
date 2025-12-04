'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900"
                placeholder="https://exemplo.com/feed.xml"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                ℹ️ Mapeamento de Tags XML
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
              ⚠️ <strong>Atenção:</strong> Ao alterar as credenciais, você precisará fazer login novamente.
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
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
