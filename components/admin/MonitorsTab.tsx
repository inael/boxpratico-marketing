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
  ClockIcon,
  CommandLineIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Monitor, Condominium, Campaign, MediaItem, ScreenOrientation, SocialClass, TerminalTier } from '@/types';
import { LabelWithTooltip } from '@/components/ui/Tooltip';
import RemoteCommandModal from './RemoteCommandModal';
import PlayerPreviewModal from './PlayerPreviewModal';
import PageHeader from './PageHeader';

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
  // Horário de funcionamento
  const [is24h, setIs24h] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Todos os dias
  // Orientacao da tela
  const [orientation, setOrientation] = useState<ScreenOrientation>('horizontal');
  // Metricas de audiencia
  const [averageMonthlyTraffic, setAverageMonthlyTraffic] = useState<number | ''>('');
  const [averagePeoplePerHour, setAveragePeoplePerHour] = useState<number | ''>('');
  const [socialClass, setSocialClass] = useState<SocialClass | ''>('');
  // Configuracoes do terminal
  const [updateCycleMinutes, setUpdateCycleMinutes] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  // Endereco
  const [address, setAddress] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);
  // Classificacao e geolocalizacao
  const [tier, setTier] = useState<TerminalTier | ''>('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  // Barra de rodape
  const [footerEnabled, setFooterEnabled] = useState<boolean>(false);
  const [footerText, setFooterText] = useState<string>('');
  const [footerBgColor, setFooterBgColor] = useState('#000000');
  const [footerTextColor, setFooterTextColor] = useState('#F59E0B');
  const [footerSpeed, setFooterSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  // Mostrar configuracoes avancadas
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  // Modal de comandos remotos
  const [showCommandModal, setShowCommandModal] = useState(false);
  const [selectedMonitorForCommand, setSelectedMonitorForCommand] = useState<Monitor | null>(null);
  // Modal de preview do player
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedMonitorForPreview, setSelectedMonitorForPreview] = useState<Monitor | null>(null);

  const handleOpenCommands = (monitor: Monitor) => {
    setSelectedMonitorForCommand(monitor);
    setShowCommandModal(true);
  };

  const handleOpenPreview = (monitor: Monitor) => {
    setSelectedMonitorForPreview(monitor);
    setShowPreviewModal(true);
  };

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
      setMonitorLocation(editingMonitor.location || '');
      setOrientation(editingMonitor.orientation || 'horizontal');
      // Carregar horário de funcionamento
      if (editingMonitor.operatingSchedule) {
        setIs24h(editingMonitor.operatingSchedule.is24h);
        setStartTime(editingMonitor.operatingSchedule.startTime || '08:00');
        setEndTime(editingMonitor.operatingSchedule.endTime || '22:00');
        setDaysOfWeek(editingMonitor.operatingSchedule.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
      } else {
        setIs24h(true);
        setStartTime('08:00');
        setEndTime('22:00');
        setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
      }
    } else {
      setMonitorName('');
      setMonitorSlug('');
      setMonitorLocation('');
      setOrientation('horizontal');
      setIs24h(true);
      setStartTime('08:00');
      setEndTime('22:00');
      setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
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

  // Buscar endereco pelo CEP (ViaCEP)
  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setAddress(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoadingCep(false);
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

  // Formatar horário de funcionamento para exibição
  function formatOperatingSchedule(monitor: Monitor): string {
    if (!monitor.operatingSchedule || monitor.operatingSchedule.is24h) {
      return '24h';
    }
    const { startTime, endTime, daysOfWeek } = monitor.operatingSchedule;
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Verificar se é todos os dias
    const isAllDays = daysOfWeek?.length === 7;

    // Verificar se é dias úteis (Seg-Sex)
    const isWeekdays = daysOfWeek?.length === 5 &&
      [1, 2, 3, 4, 5].every(d => daysOfWeek.includes(d));

    let daysText = '';
    if (isAllDays) {
      daysText = 'Todos os dias';
    } else if (isWeekdays) {
      daysText = 'Seg-Sex';
    } else if (daysOfWeek && daysOfWeek.length > 0) {
      daysText = daysOfWeek.map(d => dayNames[d]).join(', ');
    }

    return `${startTime} - ${endTime} (${daysText})`;
  }

  // Calcular horas de funcionamento por dia
  function getOperatingHoursPerDay(monitor: Monitor): number {
    if (!monitor.operatingSchedule || monitor.operatingSchedule.is24h) {
      return 24;
    }
    const { startTime, endTime } = monitor.operatingSchedule;
    if (!startTime || !endTime) return 24;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let hours = endH - startH + (endM - startM) / 60;
    if (hours < 0) hours += 24; // Se desligar depois da meia-noite

    return hours;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Montar objeto de horario de funcionamento
    const operatingSchedule = {
      is24h,
      startTime: is24h ? undefined : startTime,
      endTime: is24h ? undefined : endTime,
      daysOfWeek: is24h ? undefined : daysOfWeek,
    };

    // Dados do monitor
    const monitorData = {
      name: monitorName,
      slug: monitorSlug,
      location: monitorLocation,
      orientation,
      operatingSchedule,
      averageMonthlyTraffic: averageMonthlyTraffic || undefined,
      averagePeoplePerHour: averagePeoplePerHour || undefined,
      socialClass: socialClass || undefined,
      updateCycleMinutes,
      soundEnabled,
      // Endereco
      address: address || undefined,
      addressNumber: addressNumber || undefined,
      complement: complement || undefined,
      zipCode: zipCode || undefined,
      neighborhood: neighborhood || undefined,
      city: city || undefined,
      state: state || undefined,
      // Classificacao e geolocalizacao
      tier: tier || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      // Rodape
      footerEnabled,
      footerText: footerEnabled ? footerText : undefined,
      footerBgColor: footerEnabled ? footerBgColor : undefined,
      footerTextColor: footerEnabled ? footerTextColor : undefined,
      footerSpeed: footerEnabled ? footerSpeed : undefined,
    };

    try {
      if (editingMonitor) {
        const response = await fetch(`/api/monitors/${editingMonitor.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(monitorData),
        });

        if (response.ok) {
          await fetchMonitors();
          resetForm();
        } else {
          const error = await response.json();
          alert(error.error || 'Erro ao atualizar tela');
        }
      } else {
        const response = await fetch('/api/monitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...monitorData,
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
          alert(error.error || 'Erro ao criar tela');
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
      alert(`Esta tela possui ${monitorCampaigns.length} playlist(s) associada(s). Remova as playlists antes de excluir.`);
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta tela?')) return;

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
    setMonitorName(monitor.name);
    setMonitorSlug(monitor.slug);
    setMonitorLocation(monitor.location || '');
    setOrientation(monitor.orientation || 'horizontal');
    setIs24h(monitor.operatingSchedule?.is24h !== false);
    setStartTime(monitor.operatingSchedule?.startTime || '08:00');
    setEndTime(monitor.operatingSchedule?.endTime || '22:00');
    setDaysOfWeek(monitor.operatingSchedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
    setAverageMonthlyTraffic(monitor.averageMonthlyTraffic || '');
    setAveragePeoplePerHour(monitor.averagePeoplePerHour || '');
    setSocialClass(monitor.socialClass || '');
    setUpdateCycleMinutes(monitor.updateCycleMinutes || 10);
    setSoundEnabled(monitor.soundEnabled || false);
    // Endereco
    setAddress(monitor.address || '');
    setAddressNumber(monitor.addressNumber || '');
    setComplement(monitor.complement || '');
    setZipCode(monitor.zipCode || '');
    setNeighborhood(monitor.neighborhood || '');
    setCity(monitor.city || '');
    setState(monitor.state || '');
    // Classificacao e geolocalizacao
    setTier(monitor.tier || '');
    setLatitude(monitor.latitude || '');
    setLongitude(monitor.longitude || '');
    // Rodape
    setFooterEnabled(monitor.footerEnabled || false);
    setFooterText(monitor.footerText || '');
    setFooterBgColor(monitor.footerBgColor || '#000000');
    setFooterTextColor(monitor.footerTextColor || '#F59E0B');
    setFooterSpeed(monitor.footerSpeed || 'normal');
    setShowAdvanced(!!monitor.averageMonthlyTraffic || !!monitor.footerEnabled || !!monitor.address);
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
    setOrientation('horizontal');
    setIs24h(true);
    setStartTime('08:00');
    setEndTime('22:00');
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setAverageMonthlyTraffic('');
    setAveragePeoplePerHour('');
    setSocialClass('');
    setUpdateCycleMinutes(10);
    setSoundEnabled(false);
    setAddress('');
    setAddressNumber('');
    setComplement('');
    setZipCode('');
    setNeighborhood('');
    setCity('');
    setState('');
    setTier('');
    setLatitude('');
    setLongitude('');
    setFooterEnabled(false);
    setFooterText('');
    setFooterBgColor('#000000');
    setFooterTextColor('#F59E0B');
    setFooterSpeed('normal');
    setShowAdvanced(false);
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
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Minhas Telas"
        helpTitle="Minhas Telas"
        helpDescription="Cadastre e monitore suas telas de exibição. Veja status online/offline, configure grades e gerencie a operação."
        actions={
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Atualização automática
              </span>
              <span className="bg-gray-100 px-2 py-0.5 rounded-full font-mono font-medium text-gray-600">
                {nextUpdateCountdown}s
              </span>
            </span>
            {selectedCondominium && !showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all font-semibold shadow-md text-sm sm:text-base w-full sm:w-auto"
              >
                <PlusIcon className="w-5 h-5" />
                Nova Tela
              </button>
            )}
          </div>
        }
      />

      {condominiums.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <TvIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Crie um local primeiro</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Local Selecionado
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
                {editingMonitor ? 'Editar Tela' : 'Nova Tela'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome da Tela *
                  </label>
                  <input
                    type="text"
                    value={monitorName}
                    onChange={(e) => setMonitorName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white text-gray-900"
                    placeholder="Ex: TV Recepção, Tela Salão de Festas"
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

                {/* Orientação da Tela */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Orientação da Tela
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrientation('horizontal')}
                      className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        orientation === 'horizontal'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-8 rounded border-2 flex items-center justify-center ${
                        orientation === 'horizontal' ? 'border-indigo-500 bg-indigo-600/20' : 'border-gray-300'
                      }`}>
                        <TvIcon className={`w-5 h-4 ${orientation === 'horizontal' ? 'text-indigo-700' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${orientation === 'horizontal' ? 'text-indigo-700' : 'text-gray-700'}`}>
                          Horizontal
                        </p>
                        <p className="text-xs text-gray-500">Paisagem (16:9)</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('vertical')}
                      className={`flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        orientation === 'vertical'
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-12 rounded border-2 flex items-center justify-center ${
                        orientation === 'vertical' ? 'border-indigo-500 bg-indigo-600/20' : 'border-gray-300'
                      }`}>
                        <TvIcon className={`w-4 h-5 rotate-90 ${orientation === 'vertical' ? 'text-indigo-700' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${orientation === 'vertical' ? 'text-indigo-700' : 'text-gray-700'}`}>
                          Vertical
                        </p>
                        <p className="text-xs text-gray-500">Retrato (9:16)</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Horário de Funcionamento */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Horário de Funcionamento</h4>

                  <div className="flex items-center gap-3 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        checked={is24h}
                        onChange={() => setIs24h(true)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">24 horas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        checked={!is24h}
                        onChange={() => setIs24h(false)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">Horário personalizado</span>
                    </label>
                  </div>

                  {!is24h && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Ligar às</label>
                          <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Desligar às</label>
                          <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Dias da semana</label>
                        <div className="flex flex-wrap gap-2">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                setDaysOfWeek(prev =>
                                  prev.includes(index)
                                    ? prev.filter(d => d !== index)
                                    : [...prev, index].sort()
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                daysOfWeek.includes(index)
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-500'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-gray-500">
                        A tela ficara ativa de {startTime} as {endTime} nos dias selecionados
                      </p>
                    </div>
                  )}
                </div>

                {/* Botao para mostrar configuracoes avancadas */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    {showAdvanced ? '▼' : '▶'} Configuracoes Avancadas
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                    {/* Endereco */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Endereco do Local</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <LabelWithTooltip
                            label="CEP"
                            tooltip="Digite o CEP para preencher o endereco automaticamente."
                            htmlFor="zipCode"
                          />
                          <div className="relative mt-1">
                            <input
                              id="zipCode"
                              type="text"
                              maxLength={9}
                              value={zipCode}
                              onChange={(e) => {
                                const v = e.target.value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');
                                setZipCode(v);
                                if (v.replace(/\D/g, '').length === 8) handleCepLookup(v);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                              placeholder="00000-000"
                            />
                            {loadingCep && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <ArrowPathIcon className="w-4 h-4 text-indigo-500 animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <LabelWithTooltip label="Endereco" tooltip="Rua, avenida ou logradouro" htmlFor="address" />
                          <input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="Rua Example"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Numero</label>
                          <input
                            type="text"
                            value={addressNumber}
                            onChange={(e) => setAddressNumber(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="123"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                          <input
                            type="text"
                            value={complement}
                            onChange={(e) => setComplement(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="Sala 1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                          <input
                            type="text"
                            value={neighborhood}
                            onChange={(e) => setNeighborhood(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="Centro"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                            <input
                              type="text"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                              placeholder="Sao Paulo"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
                            <input
                              type="text"
                              maxLength={2}
                              value={state}
                              onChange={(e) => setState(e.target.value.toUpperCase())}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                              placeholder="SP"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Classificacao e Geolocalizacao */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Classificacao do Ponto</h4>
                      <div className="mb-4">
                        <LabelWithTooltip
                          label="Tier do terminal"
                          tooltip="Classificacao do ponto para precificacao. GOLD: locais premium (2x preco), SILVER: intermediarios (1.5x), BRONZE: basicos (1x)."
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {([
                            { value: 'GOLD' as TerminalTier, label: 'Gold', color: 'bg-yellow-500', emoji: '🥇' },
                            { value: 'SILVER' as TerminalTier, label: 'Silver', color: 'bg-gray-400', emoji: '🥈' },
                            { value: 'BRONZE' as TerminalTier, label: 'Bronze', color: 'bg-orange-600', emoji: '🥉' },
                          ]).map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              onClick={() => setTier(tier === t.value ? '' : t.value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                tier === t.value
                                  ? `${t.color} text-white`
                                  : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-500'
                              }`}
                            >
                              <span>{t.emoji}</span> {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <LabelWithTooltip
                            label="Latitude"
                            tooltip="Coordenada geografica. Usada para filtrar terminais por raio no simulador de campanhas."
                            htmlFor="latitude"
                          />
                          <input
                            id="latitude"
                            type="number"
                            step="0.000001"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="-23.550520"
                          />
                        </div>
                        <div>
                          <LabelWithTooltip
                            label="Longitude"
                            tooltip="Coordenada geografica. Usada para filtrar terminais por raio no simulador de campanhas."
                            htmlFor="longitude"
                          />
                          <input
                            id="longitude"
                            type="number"
                            step="0.000001"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="-46.633309"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metricas de Audiencia */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        Metricas de Audiencia
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <LabelWithTooltip
                            label="Fluxo mensal de pessoas"
                            tooltip="Quantas pessoas circulam neste local por mes. Usado para calcular o alcance dos anuncios."
                            htmlFor="averageMonthlyTraffic"
                          />
                          <input
                            id="averageMonthlyTraffic"
                            type="number"
                            min={0}
                            value={averageMonthlyTraffic}
                            onChange={(e) => setAverageMonthlyTraffic(e.target.value ? parseInt(e.target.value) : '')}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="Ex: 5000"
                          />
                        </div>
                        <div>
                          <LabelWithTooltip
                            label="Media de pessoas/hora"
                            tooltip="Quantas pessoas estao presentes simultaneamente em media. Ex: em uma academia, podem ter 30 pessoas ao mesmo tempo."
                            htmlFor="averagePeoplePerHour"
                          />
                          <input
                            id="averagePeoplePerHour"
                            type="number"
                            min={0}
                            value={averagePeoplePerHour}
                            onChange={(e) => setAveragePeoplePerHour(e.target.value ? parseInt(e.target.value) : '')}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                            placeholder="Ex: 30"
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <LabelWithTooltip
                          label="Classe social predominante"
                          tooltip="Classe social do publico que frequenta o local. Ajuda anunciantes a segmentar campanhas."
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(['A', 'B', 'C', 'D', 'E'] as SocialClass[]).map((cls) => (
                            <button
                              key={cls}
                              type="button"
                              onClick={() => setSocialClass(socialClass === cls ? '' : cls)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                socialClass === cls
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-500'
                              }`}
                            >
                              Classe {cls}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Configuracoes do Terminal */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Configuracoes do Terminal</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <LabelWithTooltip
                            label="Ciclo de atualizacao (min)"
                            tooltip="Intervalo em minutos para verificar novas midias no servidor. Recomendado: 10 minutos."
                            htmlFor="updateCycleMinutes"
                          />
                          <input
                            id="updateCycleMinutes"
                            type="number"
                            min={1}
                            max={60}
                            value={updateCycleMinutes}
                            onChange={(e) => setUpdateCycleMinutes(parseInt(e.target.value) || 10)}
                            className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center gap-3 cursor-pointer mt-6">
                            <input
                              type="checkbox"
                              checked={soundEnabled}
                              onChange={(e) => setSoundEnabled(e.target.checked)}
                              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Som do terminal ligado</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Barra de Rodape */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Barra de Rodape (Ticker)
                        </h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={footerEnabled}
                            onChange={(e) => setFooterEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      {footerEnabled && (
                        <div className="space-y-4">
                          <div>
                            <LabelWithTooltip
                              label="Texto do rodape"
                              tooltip="Texto que aparecera rolando na parte inferior da tela. Use para avisos, informacoes do local, etc."
                              htmlFor="footerText"
                            />
                            <textarea
                              id="footerText"
                              value={footerText}
                              onChange={(e) => setFooterText(e.target.value)}
                              rows={2}
                              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white resize-none"
                              placeholder="Ex: Bem-vindo ao Condominio! WiFi: condominio123 | Proibido fumar nas areas comuns"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Cor do fundo</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={footerBgColor}
                                  onChange={(e) => setFooterBgColor(e.target.value)}
                                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={footerBgColor}
                                  onChange={(e) => setFooterBgColor(e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Cor do texto</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={footerTextColor}
                                  onChange={(e) => setFooterTextColor(e.target.value)}
                                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={footerTextColor}
                                  onChange={(e) => setFooterTextColor(e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                  placeholder="#F59E0B"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Velocidade</label>
                              <select
                                value={footerSpeed}
                                onChange={(e) => setFooterSpeed(e.target.value as 'slow' | 'normal' | 'fast')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                              >
                                <option value="slow">Lenta</option>
                                <option value="normal">Normal</option>
                                <option value="fast">Rapida</option>
                              </select>
                            </div>
                          </div>
                          {/* Preview do ticker */}
                          {footerText && (
                            <div
                              className="rounded-lg overflow-hidden h-10 flex items-center relative"
                              style={{ backgroundColor: footerBgColor }}
                            >
                              <span
                                className="whitespace-nowrap text-sm font-medium px-4 animate-pulse"
                                style={{ color: footerTextColor }}
                              >
                                {footerText}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    {editingMonitor ? 'Atualizar' : 'Criar'} Tela
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

          {/* Tabela de Telas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Orientacao
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Horario
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Playlist
                    </th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ativa
                    </th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Opcoes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMonitors.map((monitor) => {
                    const monitorCampaigns = getMonitorCampaigns(monitor.id);
                    const activeCampaign = monitorCampaigns.find(c => c.isActive);
                    const mediaCount = activeCampaign ? getCampaignMediaCount(activeCampaign.id) : 0;

                    return (
                      <tr key={monitor.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              monitor.isOnline
                                ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                                : 'bg-gradient-to-br from-indigo-400/20 to-indigo-500/20'
                            }`}>
                              <TvIcon className={`w-5 h-5 ${monitor.isOnline ? 'text-green-600' : 'text-indigo-700'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{monitor.name}</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs text-gray-500">/monitor/{monitor.slug}</code>
                                <button
                                  onClick={() => copyToClipboard(monitor.slug)}
                                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                                  title="Copiar URL"
                                >
                                  <ClipboardDocumentIcon className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                                </button>
                                {copiedSlug === monitor.slug && (
                                  <span className="text-xs text-green-600 font-medium">Copiado!</span>
                                )}
                              </div>
                              {monitor.location && (
                                <p className="text-xs text-gray-400">{monitor.location}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {monitor.isOnline ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                              <span className="text-xs font-medium text-green-700">Online</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              <span className="text-xs font-medium text-gray-500">Offline</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded ${
                            monitor.orientation === 'vertical'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}>
                            <div className={`${monitor.orientation === 'vertical' ? 'w-2 h-3' : 'w-3 h-2'} border rounded-sm ${
                              monitor.orientation === 'vertical' ? 'border-purple-400' : 'border-indigo-400'
                            }`}></div>
                            <span className="font-medium">
                              {monitor.orientation === 'vertical' ? 'Vertical' : 'Horizontal'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <ClockIcon className="w-4 h-4 text-blue-500" />
                            <span>{formatOperatingSchedule(monitor)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {activeCampaign ? (
                            <div>
                              <p className="text-sm font-medium text-gray-900">{activeCampaign.name}</p>
                              <p className="text-xs text-gray-500">
                                {mediaCount} {mediaCount === 1 ? 'mídia' : 'mídias'}
                              </p>
                              {mediaCount === 0 && (
                                <span className="text-xs text-amber-600">Sem conteúdo</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-yellow-600">Nenhuma</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => toggleActive(monitor)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              monitor.isActive ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                monitor.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/monitor/${monitor.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all"
                              title="Abrir player"
                            >
                              <TvIcon className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => handleOpenPreview(monitor)}
                              className="p-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all"
                              title="Visualizar player"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenCommands(monitor)}
                              className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                              title="Comandos remotos"
                            >
                              <CommandLineIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(monitor)}
                              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(monitor.id)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                              title="Excluir"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredMonitors.length === 0 && !showForm && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <TvIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma tela cadastrada ainda</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Criar primeira tela
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de comandos remotos */}
      <RemoteCommandModal
        isOpen={showCommandModal}
        onClose={() => {
          setShowCommandModal(false);
          setSelectedMonitorForCommand(null);
        }}
        monitor={selectedMonitorForCommand}
      />

      {/* Modal de preview do player */}
      <PlayerPreviewModal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedMonitorForPreview(null);
        }}
        monitor={selectedMonitorForPreview}
      />
    </div>
  );
}
