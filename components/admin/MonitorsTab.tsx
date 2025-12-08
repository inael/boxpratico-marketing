'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  TvIcon,
  ClipboardDocumentIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { Monitor, Condominium, Campaign } from '@/types';

interface MonitorsTabProps {
  condominiums: Condominium[];
}

export default function MonitorsTab({ condominiums }: MonitorsTabProps) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [monitorName, setMonitorName] = useState('');
  const [monitorSlug, setMonitorSlug] = useState('');
  const [monitorLocation, setMonitorLocation] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    if (condominiums.length > 0 && !selectedCondominium) {
      setSelectedCondominium(condominiums[0].id);
    }
  }, [condominiums]);

  useEffect(() => {
    if (selectedCondominium) {
      fetchMonitors();
      fetchCampaigns();
    }
  }, [selectedCondominium]);

  // Auto-refresh monitors status every 10 seconds
  useEffect(() => {
    if (!selectedCondominium) return;

    const interval = setInterval(() => {
      fetchMonitorsStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedCondominium]);

  useEffect(() => {
    if (editingMonitor) {
      setMonitorName(editingMonitor.name);
      setMonitorSlug(editingMonitor.slug);
      setMonitorLocation(editingMonitor.location);
    } else {
      setMonitorName('');
      setMonitorSlug('');
      setMonitorLocation('');
    }
  }, [editingMonitor]);

  useEffect(() => {
    if (!editingMonitor) {
      setMonitorSlug(sanitizeSlug(monitorName));
    }
  }, [monitorName, editingMonitor]);

  const fetchMonitors = async () => {
    try {
      const response = await fetch(`/api/monitors/heartbeat?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setMonitors(data);
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    }
  };

  const fetchMonitorsStatus = async () => {
    try {
      const response = await fetch(`/api/monitors/heartbeat?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setMonitors(data);
    } catch (error) {
      console.error('Failed to fetch monitors status:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`/api/campaigns?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  function sanitizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMonitor) {
        const response = await fetch(`/api/monitors/${editingMonitor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: monitorName,
            slug: monitorSlug,
            location: monitorLocation,
          }),
        });

        if (response.ok) {
          await fetchMonitors();
          resetForm();
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao atualizar monitor');
        }
      } else {
        const response = await fetch('/api/monitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: monitorName,
            slug: monitorSlug,
            location: monitorLocation,
            condominiumId: selectedCondominium,
            isActive: true,
          }),
        });

        if (response.ok) {
          await fetchMonitors();
          resetForm();
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao criar monitor');
        }
      }
    } catch (error) {
      console.error('Failed to save monitor:', error);
    }
  };

  const handleDelete = async (id: string) => {
    // Check if monitor has campaigns associated
    const monitorCampaigns = campaigns.filter(c => c.monitorId === id);
    if (monitorCampaigns.length > 0) {
      alert(`Este monitor possui ${monitorCampaigns.length} campanha(s) associada(s). Remova as campanhas antes de excluir.`);
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este monitor?')) return;

    try {
      const response = await fetch(`/api/monitors/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMonitors();
      }
    } catch (error) {
      console.error('Failed to delete monitor:', error);
    }
  };

  const handleEdit = (monitor: Monitor) => {
    setEditingMonitor(monitor);
    setShowForm(true);
  };

  const toggleActive = async (monitor: Monitor) => {
    try {
      const response = await fetch(`/api/monitors/${monitor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !monitor.isActive }),
      });

      if (response.ok) {
        await fetchMonitors();
      }
    } catch (error) {
      console.error('Failed to toggle monitor:', error);
    }
  };

  const resetForm = () => {
    setMonitorName('');
    setMonitorSlug('');
    setMonitorLocation('');
    setEditingMonitor(null);
    setShowForm(false);
  };

  const getMonitorUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/monitor/${slug}`;
    }
    return `/monitor/${slug}`;
  };

  const copyToClipboard = (slug: string) => {
    const url = getMonitorUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getMonitorCampaigns = (monitorId: string) => {
    return campaigns.filter(c => c.monitorId === monitorId);
  };

  const filteredMonitors = monitors.filter(m => m.condominiumId === selectedCondominium);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-gray-900">Monitores</h2>
          <p className="text-gray-600 mt-1">Cadastre os monitores/TVs de cada local</p>
        </div>
        {selectedCondominium && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            Novo Monitor
          </button>
        )}
      </div>

      {condominiums.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <TvIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Crie um condomínio primeiro</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Condomínio Selecionado
            </label>
            <select
              value={selectedCondominium}
              onChange={(e) => setSelectedCondominium(e.target.value)}
              disabled={showForm}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none font-medium bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {condominiums.map((condo) => (
                <option key={condo.id} value={condo.id}>
                  {condo.name}
                </option>
              ))}
            </select>
          </div>

          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <h3 className="text-xl font-display font-bold text-gray-900 mb-4">
                {editingMonitor ? 'Editar Monitor' : 'Novo Monitor'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome do Monitor *
                  </label>
                  <input
                    type="text"
                    value={monitorName}
                    onChange={(e) => setMonitorName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    placeholder="Ex: TV Churrasqueira, Monitor Salão de Festas"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Slug (URL) *
                  </label>
                  <input
                    type="text"
                    value={monitorSlug}
                    onChange={(e) => setMonitorSlug(sanitizeSlug(e.target.value))}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    placeholder="tv-churrasqueira"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL do player: /monitor/{monitorSlug || 'slug'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={monitorLocation}
                    onChange={(e) => setMonitorLocation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    placeholder="Ex: Área da churrasqueira, próximo à piscina"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    {editingMonitor ? 'Atualizar' : 'Criar'} Monitor
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMonitors.map((monitor, index) => {
              const monitorCampaigns = getMonitorCampaigns(monitor.id);
              const activeCampaign = monitorCampaigns.find(c => c.isActive);

              return (
                <motion.div
                  key={monitor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        monitor.isOnline
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                          : 'bg-gradient-to-br from-indigo-100 to-pink-100'
                      }`}>
                        <TvIcon className={`w-6 h-6 ${monitor.isOnline ? 'text-green-600' : 'text-indigo-600'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-display font-bold text-gray-900">{monitor.name}</h3>
                        {monitor.location && (
                          <p className="text-sm text-gray-500 mt-1">{monitor.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {monitor.isOnline ? (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-xs font-medium text-green-700">Online</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                          <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                          <span className="text-xs font-medium text-gray-500">Offline</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <code className="text-xs text-gray-600 flex-1 truncate">/monitor/{monitor.slug}</code>
                      <button
                        onClick={() => copyToClipboard(monitor.slug)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Copiar URL"
                      >
                        <ClipboardDocumentIcon className="w-4 h-4 text-gray-500" />
                      </button>
                      {copiedSlug === monitor.slug && (
                        <span className="text-xs text-green-600 font-medium">Copiado!</span>
                      )}
                    </div>

                    {activeCampaign ? (
                      <div className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                        <span className="font-semibold">Campanha ativa:</span> {activeCampaign.name}
                      </div>
                    ) : (
                      <div className="text-xs bg-yellow-50 text-yellow-700 px-3 py-2 rounded-lg">
                        Nenhuma campanha ativa
                      </div>
                    )}

                    {monitorCampaigns.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {monitorCampaigns.length} campanha(s) associada(s)
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`/monitor/${monitor.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all text-sm font-medium"
                      title="Abrir player"
                    >
                      <TvIcon className="w-4 h-4" />
                      Player
                    </a>

                    <button
                      onClick={() => toggleActive(monitor)}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        monitor.isActive
                          ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {monitor.isActive ? (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          Ativar
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleEdit(monitor)}
                      className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(monitor.id)}
                      className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredMonitors.length === 0 && !showForm && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <TvIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum monitor cadastrado ainda</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Criar primeiro monitor
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
