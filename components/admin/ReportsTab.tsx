'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MediaItem, Campaign, Condominium, Monitor, Advertiser, MediaExposureReport, AdvertiserExposureReport } from '@/types';
import {
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarDaysIcon,
  TvIcon,
  PhotoIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  DocumentTextIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  PrinterIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import Tooltip, { LabelWithTooltip } from '@/components/ui/Tooltip';

// Constantes para cálculo de exposição
const HOURS_PER_DAY = 12; // Assumindo 12 horas de operação por dia
const SECONDS_PER_HOUR = 3600;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;

// Helper para formatar segundos em tempo legível
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// Helper para formatar números grandes
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString('pt-BR');
}

// Helper para formatar data
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Tipo de período
type PeriodType = 'day' | 'week' | 'month' | 'year' | 'custom';

// Tipo de relatório
type ReportType = 'advertisers' | 'media' | 'locations' | 'playlists' | 'financial';

interface ReportsTabProps {
  condominiums: Condominium[];
  monitors: Monitor[];
}

export default function ReportsTab({ condominiums, monitors }: ReportsTabProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<ReportType>('advertisers');
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>('all');
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>('all');
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadData() {
    try {
      const [mediaRes, campaignsRes, advertisersRes] = await Promise.all([
        fetch('/api/media-items'),
        fetch('/api/campaigns'),
        fetch('/api/advertisers'),
      ]);

      const [media, camps, advs] = await Promise.all([
        mediaRes.json(),
        campaignsRes.json(),
        advertisersRes.json(),
      ]);

      setMediaItems(media);
      setCampaigns(camps);
      setAdvertisers(advs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Multiplicador baseado no período selecionado
  const periodMultiplier = useMemo(() => {
    switch (periodType) {
      case 'day': return 1;
      case 'week': return DAYS_PER_WEEK;
      case 'month': return DAYS_PER_MONTH;
      case 'year': return DAYS_PER_YEAR;
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return Math.max(days, 1);
        }
        return DAYS_PER_MONTH;
      default: return DAYS_PER_MONTH;
    }
  }, [periodType, customStartDate, customEndDate]);

  // Calcular exposição por mídia
  const mediaReports = useMemo((): MediaExposureReport[] => {
    const activeMedia = mediaItems.filter(m => m.isActive);

    return activeMedia.map(media => {
      const condo = condominiums.find(c => c.id === media.condominiumId);
      const campaign = campaigns.find(c => c.id === media.campaignId);
      const advertiser = advertisers.find(a => a.id === media.advertiserId);

      // Número de monitores ativos neste local
      const localMonitors = monitors.filter(
        m => m.condominiumId === media.condominiumId && m.isActive
      );
      const monitorsCount = Math.max(localMonitors.length, 1);

      // Mídias ativas no mesmo local/playlist
      const sameScopeMedia = activeMedia.filter(m => {
        if (campaign) {
          return m.campaignId === campaign.id && m.isActive;
        }
        return m.condominiumId === media.condominiumId && m.isActive;
      });

      // Duração de cada exibição da mídia em segundos
      const mediaDuration = media.durationSeconds || 10;

      // Tempo total do ciclo (todas as mídias do loop)
      const cycleDuration = sameScopeMedia.reduce((acc, m) => acc + (m.durationSeconds || 10), 0);

      // Exibições por hora = 3600 / tempo do ciclo
      const exposuresPerHour = cycleDuration > 0 ? Math.floor(SECONDS_PER_HOUR / cycleDuration) : 0;

      // Exibições por dia = exibições por hora * horas de operação * número de monitores
      const exposuresPerDay = exposuresPerHour * HOURS_PER_DAY * monitorsCount;

      // Tempo de exposição por dia em segundos
      const totalSecondsPerDay = exposuresPerDay * mediaDuration;

      return {
        mediaId: media.id,
        mediaTitle: media.title,
        mediaType: media.type,
        advertiserId: media.advertiserId,
        advertiserName: advertiser?.name,
        exposuresPerDay,
        exposuresPerWeek: exposuresPerDay * DAYS_PER_WEEK,
        exposuresPerMonth: exposuresPerDay * DAYS_PER_MONTH,
        exposuresPerYear: exposuresPerDay * DAYS_PER_YEAR,
        totalSecondsPerDay,
        totalSecondsPerWeek: totalSecondsPerDay * DAYS_PER_WEEK,
        totalSecondsPerMonth: totalSecondsPerDay * DAYS_PER_MONTH,
        totalSecondsPerYear: totalSecondsPerDay * DAYS_PER_YEAR,
        campaignId: media.campaignId,
        campaignName: campaign?.name,
        condominiumId: media.condominiumId || '',
        condominiumName: condo?.name || 'Local não encontrado',
        monitorsCount,
      };
    });
  }, [mediaItems, campaigns, condominiums, monitors, advertisers]);

  // Relatório por anunciante
  const advertiserReports = useMemo((): AdvertiserExposureReport[] => {
    const activeAdvertisers = advertisers.filter(a => a.isActive);

    return activeAdvertisers.map(advertiser => {
      const advertiserMedia = mediaReports.filter(m => m.advertiserId === advertiser.id);

      // Locais únicos onde o anunciante aparece
      const uniqueLocations = new Set(advertiserMedia.map(m => m.condominiumId));

      // Total de monitores (pode ter múltiplos por local)
      const totalMonitors = advertiserMedia.reduce((acc, m) => acc + m.monitorsCount, 0);

      return {
        advertiserId: advertiser.id,
        advertiserName: advertiser.name,
        advertiserSegment: advertiser.segment,
        totalMediaItems: advertiserMedia.length,
        totalExposuresPerDay: advertiserMedia.reduce((acc, m) => acc + m.exposuresPerDay, 0),
        totalExposuresPerWeek: advertiserMedia.reduce((acc, m) => acc + m.exposuresPerWeek, 0),
        totalExposuresPerMonth: advertiserMedia.reduce((acc, m) => acc + m.exposuresPerMonth, 0),
        totalExposuresPerYear: advertiserMedia.reduce((acc, m) => acc + m.exposuresPerYear, 0),
        totalSecondsPerDay: advertiserMedia.reduce((acc, m) => acc + m.totalSecondsPerDay, 0),
        totalSecondsPerWeek: advertiserMedia.reduce((acc, m) => acc + m.totalSecondsPerWeek, 0),
        totalSecondsPerMonth: advertiserMedia.reduce((acc, m) => acc + m.totalSecondsPerMonth, 0),
        totalSecondsPerYear: advertiserMedia.reduce((acc, m) => acc + m.totalSecondsPerYear, 0),
        locationsCount: uniqueLocations.size,
        monitorsCount: totalMonitors,
      };
    }).filter(r => r.totalMediaItems > 0);
  }, [advertisers, mediaReports]);

  // Relatório por local
  const locationReports = useMemo(() => {
    return condominiums.map(condo => {
      const localMedia = mediaReports.filter(m => m.condominiumId === condo.id);
      const localMonitors = monitors.filter(m => m.condominiumId === condo.id && m.isActive);

      // Anunciantes únicos neste local
      const uniqueAdvertisers = new Set(localMedia.filter(m => m.advertiserId).map(m => m.advertiserId));

      return {
        condominiumId: condo.id,
        condominiumName: condo.name,
        city: condo.city,
        state: condo.state,
        totalMediaItems: localMedia.length,
        totalAdvertisers: uniqueAdvertisers.size,
        monitorsCount: localMonitors.length,
        totalExposuresPerDay: localMedia.reduce((acc, m) => acc + m.exposuresPerDay, 0),
        totalExposuresPerMonth: localMedia.reduce((acc, m) => acc + m.exposuresPerMonth, 0),
        totalSecondsPerDay: localMedia.reduce((acc, m) => acc + m.totalSecondsPerDay, 0),
        commission: condo.commission?.percentage,
        pricing: condo.pricing,
      };
    }).filter(r => r.totalMediaItems > 0);
  }, [condominiums, mediaReports, monitors]);

  // Relatório por playlist
  const playlistReports = useMemo(() => {
    return campaigns.filter(c => c.isActive).map(campaign => {
      const campaignMedia = mediaReports.filter(m => m.campaignId === campaign.id);
      const advertiser = advertisers.find(a => a.id === campaign.advertiserId);

      // Locais únicos
      const uniqueLocations = new Set(campaignMedia.map(m => m.condominiumId));

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        advertiserId: campaign.advertiserId,
        advertiserName: advertiser?.name || 'Interno',
        totalMediaItems: campaignMedia.length,
        locationsCount: uniqueLocations.size,
        totalExposuresPerDay: campaignMedia.reduce((acc, m) => acc + m.exposuresPerDay, 0),
        totalExposuresPerMonth: campaignMedia.reduce((acc, m) => acc + m.exposuresPerMonth, 0),
        totalSecondsPerDay: campaignMedia.reduce((acc, m) => acc + m.totalSecondsPerDay, 0),
        startDate: campaign.startDate,
        endDate: campaign.endDate,
      };
    }).filter(r => r.totalMediaItems > 0);
  }, [campaigns, mediaReports, advertisers]);

  // Relatório financeiro estimado
  const financialReports = useMemo(() => {
    return advertiserReports.map(adv => {
      // Estimar valor com base em exposições (CPM médio de R$ 5)
      const estimatedCPM = 5;
      const exposures = adv.totalExposuresPerMonth;
      const estimatedValue = (exposures / 1000) * estimatedCPM;

      return {
        ...adv,
        estimatedMonthlyValue: estimatedValue,
        estimatedYearlyValue: estimatedValue * 12,
      };
    });
  }, [advertiserReports]);

  // Filtrar mídias por local e anunciante selecionados
  const filteredMediaReports = useMemo(() => {
    let filtered = mediaReports;
    if (selectedCondominiumId !== 'all') {
      filtered = filtered.filter(m => m.condominiumId === selectedCondominiumId);
    }
    if (selectedAdvertiserId !== 'all') {
      filtered = filtered.filter(m => m.advertiserId === selectedAdvertiserId);
    }
    return filtered;
  }, [mediaReports, selectedCondominiumId, selectedAdvertiserId]);

  // Totais gerais
  const totals = useMemo(() => {
    return {
      totalMedia: mediaItems.filter(m => m.isActive).length,
      totalAdvertisers: advertiserReports.length,
      totalLocations: locationReports.length,
      totalMonitors: monitors.filter(m => m.isActive).length,
      totalExposuresPerDay: mediaReports.reduce((acc, m) => acc + m.exposuresPerDay, 0),
      totalExposuresPerMonth: mediaReports.reduce((acc, m) => acc + m.exposuresPerMonth, 0),
      totalPlaylists: campaigns.filter(c => c.isActive).length,
    };
  }, [mediaItems, advertiserReports, locationReports, monitors, mediaReports, campaigns]);

  // Função para exportar CSV
  const exportCSV = () => {
    let csvContent = '';
    let filename = '';

    switch (selectedView) {
      case 'advertisers':
        csvContent = 'Anunciante,Segmento,Mídias,Locais,Telas,Exibições/Dia,Exibições/Semana,Exibições/Mês,Exibições/Ano,Tempo/Dia\n';
        advertiserReports.forEach(r => {
          csvContent += `"${r.advertiserName}","${r.advertiserSegment || ''}",${r.totalMediaItems},${r.locationsCount},${r.monitorsCount},${r.totalExposuresPerDay},${r.totalExposuresPerWeek},${r.totalExposuresPerMonth},${r.totalExposuresPerYear},"${formatDuration(r.totalSecondsPerDay)}"\n`;
        });
        filename = 'relatorio-anunciantes.csv';
        break;

      case 'media':
        csvContent = 'Mídia,Anunciante,Local,Exibições/Dia,Exibições/Mês,Tempo/Dia\n';
        filteredMediaReports.forEach(r => {
          csvContent += `"${r.mediaTitle}","${r.advertiserName || 'Interno'}","${r.condominiumName}",${r.exposuresPerDay},${r.exposuresPerMonth},"${formatDuration(r.totalSecondsPerDay)}"\n`;
        });
        filename = 'relatorio-midias.csv';
        break;

      case 'locations':
        csvContent = 'Local,Cidade,Estado,Telas,Mídias,Anunciantes,Exibições/Dia,Exibições/Mês,Comissão\n';
        locationReports.forEach(r => {
          csvContent += `"${r.condominiumName}","${r.city || ''}","${r.state || ''}",${r.monitorsCount},${r.totalMediaItems},${r.totalAdvertisers},${r.totalExposuresPerDay},${r.totalExposuresPerMonth},${r.commission || 0}%\n`;
        });
        filename = 'relatorio-locais.csv';
        break;

      case 'playlists':
        csvContent = 'Playlist,Anunciante,Mídias,Locais,Exibições/Dia,Exibições/Mês,Início,Fim\n';
        playlistReports.forEach(r => {
          csvContent += `"${r.campaignName}","${r.advertiserName}",${r.totalMediaItems},${r.locationsCount},${r.totalExposuresPerDay},${r.totalExposuresPerMonth},"${r.startDate || '-'}","${r.endDate || '-'}"\n`;
        });
        filename = 'relatorio-playlists.csv';
        break;

      case 'financial':
        csvContent = 'Anunciante,Segmento,Exibições/Mês,Valor Estimado/Mês,Valor Estimado/Ano\n';
        financialReports.forEach(r => {
          csvContent += `"${r.advertiserName}","${r.advertiserSegment || ''}",${r.totalExposuresPerMonth},R$ ${r.estimatedMonthlyValue.toFixed(2)},R$ ${r.estimatedYearlyValue.toFixed(2)}\n`;
        });
        filename = 'relatorio-financeiro.csv';
        break;
    }

    // Add BOM for Excel to recognize UTF-8
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Função para imprimir
  const handlePrint = () => {
    window.print();
    setShowExportMenu(false);
  };

  // Período label
  const periodLabel = useMemo(() => {
    switch (periodType) {
      case 'day': return 'Dia';
      case 'week': return 'Semana';
      case 'month': return 'Mês';
      case 'year': return 'Ano';
      case 'custom': return 'Personalizado';
      default: return 'Mês';
    }
  }, [periodType]);

  const reportTypes = [
    { id: 'advertisers', label: 'Anunciantes', icon: UserGroupIcon },
    { id: 'media', label: 'Mídias', icon: PhotoIcon },
    { id: 'locations', label: 'Locais', icon: BuildingOfficeIcon },
    { id: 'playlists', label: 'Playlists', icon: ChartBarIcon },
    { id: 'financial', label: 'Financeiro', icon: DocumentTextIcon },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-amber-500" />
            Relatórios de Exposição
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe métricas detalhadas de exibição e performance da sua rede
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Period selector */}
          <div className="relative">
            <Tooltip content="Selecione o período para os cálculos" position="top">
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white appearance-none"
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mês</option>
                <option value="year">Ano</option>
                <option value="custom">Personalizado</option>
              </select>
            </Tooltip>
            <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Custom date range */}
          {periodType === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Export button */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/25"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="font-medium">Exportar</span>
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                >
                  <button
                    onClick={exportCSV}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <TableCellsIcon className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">CSV / Excel</p>
                      <p className="text-xs text-gray-500">Planilha de dados</p>
                    </div>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <PrinterIcon className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Imprimir / PDF</p>
                      <p className="text-xs text-gray-500">Via navegador</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold">Relatório de Exposição - BoxPrático</h1>
        <p className="text-gray-500">Gerado em: {formatDate(new Date())}</p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <PhotoIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <Tooltip content="Total de mídias ativas na sua rede" position="top">
                <p className="text-2xl font-bold text-gray-900">{totals.totalMedia}</p>
              </Tooltip>
              <p className="text-xs text-gray-500">Mídias Ativas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserGroupIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <Tooltip content="Anunciantes com mídias em exibição" position="top">
                <p className="text-2xl font-bold text-gray-900">{totals.totalAdvertisers}</p>
              </Tooltip>
              <p className="text-xs text-gray-500">Anunciantes</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <EyeIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <Tooltip content={`Total estimado de exibições por ${periodLabel.toLowerCase()}`} position="top">
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(totals.totalExposuresPerDay * periodMultiplier)}
                </p>
              </Tooltip>
              <p className="text-xs text-gray-500">Exibições/{periodLabel}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TvIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <Tooltip content="Telas/monitores ativos exibindo conteúdo" position="top">
                <p className="text-2xl font-bold text-gray-900">{totals.totalMonitors}</p>
              </Tooltip>
              <p className="text-xs text-gray-500">Telas Ativas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <BuildingOfficeIcon className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <Tooltip content="Locais com conteúdo em exibição" position="top">
                <p className="text-2xl font-bold text-gray-900">{totals.totalLocations}</p>
              </Tooltip>
              <p className="text-xs text-gray-500">Locais Ativos</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs de relatórios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        <div className="border-b border-gray-100 print:hidden">
          <div className="flex flex-wrap">
            {reportTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedView(type.id as ReportType)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    selectedView === type.id
                      ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {/* Filtros adicionais para mídia */}
          {selectedView === 'media' && (
            <div className="flex flex-wrap gap-3 mb-4 print:hidden">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCondominiumId}
                  onChange={(e) => setSelectedCondominiumId(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos os locais</option>
                  {condominiums.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedAdvertiserId}
                  onChange={(e) => setSelectedAdvertiserId(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos os anunciantes</option>
                  {advertisers.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Relatório por Anunciante */}
          {selectedView === 'advertisers' && (
            <div className="space-y-4">
              {advertiserReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserGroupIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum anunciante com mídias ativas</p>
                </div>
              ) : (
                advertiserReports.map(report => (
                  <motion.div
                    key={report.advertiserId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50 rounded-lg p-4 print:break-inside-avoid"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.advertiserName}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {report.advertiserSegment && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {report.advertiserSegment}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {report.totalMediaItems} mídia(s) em {report.locationsCount} local(is)
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        <Tooltip content="Número estimado de exibições por dia" position="top">
                          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                            <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerDay)}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Por Dia</p>
                          </div>
                        </Tooltip>
                        <Tooltip content="Número estimado de exibições por semana" position="top">
                          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                            <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerWeek)}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Por Semana</p>
                          </div>
                        </Tooltip>
                        <Tooltip content="Número estimado de exibições por mês" position="top">
                          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                            <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerMonth)}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Por Mês</p>
                          </div>
                        </Tooltip>
                        <Tooltip content="Número estimado de exibições por ano" position="top">
                          <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                            <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerYear)}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Por Ano</p>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
                      <Tooltip content="Tempo total de exposição do anunciante por dia" position="top">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          {formatDuration(report.totalSecondsPerDay)}/dia de exposição
                        </span>
                      </Tooltip>
                      <span className="flex items-center gap-1">
                        <TvIcon className="w-3.5 h-3.5" />
                        {report.monitorsCount} tela(s)
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Relatório por Mídia */}
          {selectedView === 'media' && (
            <div className="space-y-4">
              {filteredMediaReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PhotoIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma mídia ativa encontrada</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Mídia</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Anunciante</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          <Tooltip content="Exibições estimadas por dia" position="top">
                            <span>Dia</span>
                          </Tooltip>
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Semana</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Mês</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Ano</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          <Tooltip content="Tempo total de exposição por dia" position="top">
                            <span>Tempo/Dia</span>
                          </Tooltip>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMediaReports.map(report => (
                        <tr key={report.mediaId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3">
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-[200px]">{report.mediaTitle}</p>
                              <p className="text-xs text-gray-500">{report.condominiumName}</p>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {report.advertiserName ? (
                              <span className="text-blue-600">{report.advertiserName}</span>
                            ) : (
                              <span className="text-gray-400 italic">Interno</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(report.exposuresPerDay)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(report.exposuresPerWeek)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(report.exposuresPerMonth)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(report.exposuresPerYear)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatDuration(report.totalSecondsPerDay)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Relatório por Local */}
          {selectedView === 'locations' && (
            <div className="space-y-4">
              {locationReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BuildingOfficeIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum local com mídias ativas</p>
                </div>
              ) : (
                locationReports.map(report => (
                  <motion.div
                    key={report.condominiumId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50 rounded-lg p-4 print:break-inside-avoid"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{report.condominiumName}</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {report.city && report.state && (
                            <span className="text-xs text-gray-500">
                              {report.city}, {report.state}
                            </span>
                          )}
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            {report.monitorsCount} tela(s)
                          </span>
                          {report.commission && (
                            <Tooltip content="Percentual de comissão acordado com este local" position="top">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                {report.commission}% comissão
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                          <p className="text-xl font-bold text-amber-600">{formatNumber(report.totalExposuresPerDay)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Exibições/Dia</p>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                          <p className="text-xl font-bold text-amber-600">{formatNumber(report.totalExposuresPerMonth)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Exibições/Mês</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <PhotoIcon className="w-3.5 h-3.5" />
                        {report.totalMediaItems} mídia(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="w-3.5 h-3.5" />
                        {report.totalAdvertisers} anunciante(s)
                      </span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formatDuration(report.totalSecondsPerDay)}/dia de conteúdo
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Relatório por Playlist */}
          {selectedView === 'playlists' && (
            <div className="space-y-4">
              {playlistReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma playlist ativa</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Playlist</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Anunciante</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Mídias</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Locais</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Exib/Dia</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Exib/Mês</th>
                        <th className="text-center py-2 px-3 font-medium text-gray-600">Período</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playlistReports.map(report => (
                        <tr key={report.campaignId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{report.campaignName}</td>
                          <td className="py-2 px-3 text-blue-600">{report.advertiserName}</td>
                          <td className="py-2 px-3 text-center">{report.totalMediaItems}</td>
                          <td className="py-2 px-3 text-center">{report.locationsCount}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(report.totalExposuresPerDay)}</td>
                          <td className="py-2 px-3 text-right font-medium">{formatNumber(report.totalExposuresPerMonth)}</td>
                          <td className="py-2 px-3 text-center text-xs text-gray-500">
                            {report.startDate || report.endDate ? (
                              <span>
                                {report.startDate || '-'} a {report.endDate || '-'}
                              </span>
                            ) : (
                              <span className="text-green-600">Sempre ativo</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Relatório Financeiro */}
          {selectedView === 'financial' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 print:hidden">
                <Tooltip content="Baseado em CPM médio de R$ 5,00 por mil impressões" position="right">
                  <p>
                    <strong>Nota:</strong> Valores estimados com base em CPM médio de R$ 5,00.
                    Use como referência para negociação.
                  </p>
                </Tooltip>
              </div>

              {financialReports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum dado financeiro disponível</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Anunciante</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-600">Segmento</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Exib/Mês</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          <Tooltip content="Valor estimado mensal baseado em CPM" position="top">
                            <span>Valor Est./Mês</span>
                          </Tooltip>
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">
                          <Tooltip content="Valor estimado anual baseado em CPM" position="top">
                            <span>Valor Est./Ano</span>
                          </Tooltip>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialReports.map(report => (
                        <tr key={report.advertiserId} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium text-gray-900">{report.advertiserName}</td>
                          <td className="py-2 px-3 text-gray-600">{report.advertiserSegment || '-'}</td>
                          <td className="py-2 px-3 text-right">{formatNumber(report.totalExposuresPerMonth)}</td>
                          <td className="py-2 px-3 text-right font-medium text-green-600">
                            R$ {report.estimatedMonthlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-green-600">
                            R$ {report.estimatedYearlyValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr className="border-t-2 border-gray-300">
                        <td colSpan={2} className="py-3 px-3 font-bold text-gray-900">Total</td>
                        <td className="py-3 px-3 text-right font-bold">
                          {formatNumber(financialReports.reduce((acc, r) => acc + r.totalExposuresPerMonth, 0))}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-green-600">
                          R$ {financialReports.reduce((acc, r) => acc + r.estimatedMonthlyValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-green-600">
                          R$ {financialReports.reduce((acc, r) => acc + r.estimatedYearlyValue, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nota explicativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 print:hidden">
        <Tooltip content="Método de cálculo das exibições" position="right">
          <p className="font-medium mb-1">Como os cálculos são feitos:</p>
        </Tooltip>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Base de {HOURS_PER_DAY} horas de operação por dia</li>
          <li>Exibições calculadas pelo tempo de cada mídia no ciclo da playlist</li>
          <li>Multiplicado pelo número de telas ativas em cada local</li>
          <li>Use estes dados para argumentar valor aos anunciantes</li>
        </ul>
      </div>
    </div>
  );
}
