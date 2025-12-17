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
import { Monitor, Condominium, Campaign, MediaItem } from '@/types';

// Helper to send WhatsApp notifications
async function sendWhatsAppNotification(
  type: string,
  condominiumName: string,
  condominiumPhone?: string,
  entityName?: string,
  details?: string
) {
  try {
    await fetch('/api/whatsapp/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        condominiumName,
        condominiumPhone,
        entityName,
        details,
      }),
    });
  } catch (error) {
    console.error('Failed to send WhatsApp notification:', error);
  }
}

interface MonitorsTabProps {
  condominiums: Condominium[];
}

export default function MonitorsTab({ condominiums }: MonitorsTabProps) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedCondominium, setSelectedCondominium] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [monitorName, setMonitorName] = useState('');
  const [monitorSlug, setMonitorSlug] = useState('');
  const [monitorLocation, setMonitorLocation] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [lastStatusCheck, setLastStatusCheck] = useState<Date | null>(null);
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState(10);

  useEffect(() => {
    if (condominiums.length > 0 && !selectedCondominium) {
      setSelectedCondominium(condominiums[0].id);
    }
  }, [condominiums]);

  useEffect(() => {
    if (selectedCondominium) {
      fetchMonitors();
      fetchCampaigns();
      fetchMediaItems();
    }
  }, [selectedCondominium]);

  // Auto-refresh monitors status every 10 seconds
  useEffect(() => {
    if (!selectedCondominium) return;

    // Reset countdown and fetch immediately when condominium changes
    setNextUpdateCountdown(10);

    const interval = setInterval(() => {
      fetchMonitorsStatus();
      setNextUpdateCountdown(10);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedCondominium]);

  // Countdown timer
  useEffect(() => {
    if (!selectedCondominium) return;

    const countdownInterval = setInterval(() => {
      setNextUpdateCountdown(prev => (prev > 0 ? prev - 1 : 10));
    }, 1000);

    return () => clearInterval(countdownInterval);
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
      const data: Monitor[] = await response.json();

      // Update only the status fields without reordering
      setMonitors(prevMonitors => {
        if (prevMonitors.length === 0) return data;

        // Create a map of new data for quick lookup
        const newDataMap = new Map(data.map(m => [m.id, m]));

        // Update existing monitors preserving order, add new ones at the end
        const updated = prevMonitors.map(m => {
          const newData = newDataMap.get(m.id);
          if (newData) {
            return { ...m, isOnline: newData.isOnline, lastHeartbeat: newData.lastHeartbeat };
          }
          return m;
        });

        // Add any new monitors that weren't in prevMonitors
        const existingIds = new Set(prevMonitors.map(m => m.id));
        const newMonitors = data.filter(m => !existingIds.has(m.id));

        return [...updated, ...newMonitors];
      });

      setLastStatusCheck(new Date());
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

  const fetchMediaItems = async () => {
    try {
      const response = await fetch(`/api/media-items?condominiumId=${selectedCondominium}`);
      const data = await response.json();
      setMediaItems(data);
    } catch (error) {
      console.error('Failed to fetch media items:', error);
    }
  };

  // Get count of media items for a specific campaign
  const getCampaignMediaCount = (campaignId: string): number => {
    return mediaItems.filter(m => m.campaignId === campaignId && m.isActive).length;
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
          // Send WhatsApp notification for new monitor
          const selectedCondo = condominiums.find(c => c.id === selectedCondominium);
          if (selectedCondo?.whatsappPhone) {
            sendWhatsAppNotification(
              'monitor_created',
              selectedCondo.name,
              selectedCondo.whatsappPhone,
              monitorName
            );
          }

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
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Atualização automática
            </span>
            <span className="bg-gray-100 px-2 py-0.5 rounded-full font-mono font-medium text-gray-600">
              {nextUpdateCountdown}s
            </span>
          </p>
        </div>
        {selectedCondominium && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md"
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
                    className="flex-1 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
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
            {filteredMonitors.map((monitor) => {
              const monitorCampaigns = getMonitorCampaigns(monitor.id);
              const activeCampaign = monitorCampaigns.find(c => c.isActive);

              return (
                <div
                  key={monitor.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        monitor.isOnline
                          ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                          : 'bg-gradient-to-br from-[#FFCE00]/20 to-[#F59E0B]/20'
                      }`}>
                        <TvIcon className={`w-6 h-6 ${monitor.isOnline ? 'text-green-600' : 'text-[#D97706]'}`} />
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
                      <>
                        <div className="text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg">
                          <span className="font-semibold">Campanha ativa:</span> {activeCampaign.name}
                          <span className="text-green-600 ml-1">
                            ({getCampaignMediaCount(activeCampaign.id)} {getCampaignMediaCount(activeCampaign.id) === 1 ? 'mídia' : 'mídias'})
                          </span>
                        </div>
                        {getCampaignMediaCount(activeCampaign.id) === 0 && (
                          <div className="text-xs bg-amber-50 text-amber-700 px-3 py-2 rounded-lg flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>Monitor não exibirá conteúdo - adicione mídias à campanha</span>
                          </div>
                        )}
                      </>
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
                </div>
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
