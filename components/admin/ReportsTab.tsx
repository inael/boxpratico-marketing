'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

interface ReportsTabProps {
  condominiums: Condominium[];
  monitors: Monitor[];
}

export default function ReportsTab({ condominiums, monitors }: ReportsTabProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'advertisers' | 'media' | 'locations'>('advertisers');
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<string>('all');

  useEffect(() => {
    loadData();
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
        condominiumId: media.condominiumId,
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
    }).filter(r => r.totalMediaItems > 0); // Só mostrar anunciantes com mídias
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
      };
    }).filter(r => r.totalMediaItems > 0);
  }, [condominiums, mediaReports, monitors]);

  // Filtrar mídias por local selecionado
  const filteredMediaReports = useMemo(() => {
    if (selectedCondominiumId === 'all') return mediaReports;
    return mediaReports.filter(m => m.condominiumId === selectedCondominiumId);
  }, [mediaReports, selectedCondominiumId]);

  // Totais gerais
  const totals = useMemo(() => {
    return {
      totalMedia: mediaItems.filter(m => m.isActive).length,
      totalAdvertisers: advertiserReports.length,
      totalLocations: locationReports.length,
      totalMonitors: monitors.filter(m => m.isActive).length,
      totalExposuresPerDay: mediaReports.reduce((acc, m) => acc + m.exposuresPerDay, 0),
      totalExposuresPerMonth: mediaReports.reduce((acc, m) => acc + m.exposuresPerMonth, 0),
    };
  }, [mediaItems, advertiserReports, locationReports, monitors, mediaReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Relatórios de Exposição</h2>
          <p className="text-gray-600 mt-1">
            Acompanhe a exposição das mídias na sua rede
          </p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <p className="text-2xl font-bold text-gray-900">{totals.totalMedia}</p>
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
              <p className="text-2xl font-bold text-gray-900">{totals.totalAdvertisers}</p>
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
              <p className="text-2xl font-bold text-gray-900">{formatNumber(totals.totalExposuresPerDay)}</p>
              <p className="text-xs text-gray-500">Exibições/Dia</p>
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
              <p className="text-2xl font-bold text-gray-900">{totals.totalMonitors}</p>
              <p className="text-xs text-gray-500">Telas Ativas</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs de visualização */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setSelectedView('advertisers')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedView === 'advertisers'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <UserGroupIcon className="w-4 h-4 inline mr-2" />
              Por Anunciante
            </button>
            <button
              onClick={() => setSelectedView('media')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedView === 'media'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <PhotoIcon className="w-4 h-4 inline mr-2" />
              Por Mídia
            </button>
            <button
              onClick={() => setSelectedView('locations')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedView === 'locations'
                  ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
              Por Local
            </button>
          </div>
        </div>

        <div className="p-4">
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
                    className="bg-gray-50 rounded-lg p-4"
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
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerDay)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Por Dia</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerWeek)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Por Semana</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerMonth)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Por Mês</p>
                        </div>
                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                          <p className="text-lg font-bold text-amber-600">{formatNumber(report.totalExposuresPerYear)}</p>
                          <p className="text-[10px] text-gray-500 uppercase">Por Ano</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {formatDuration(report.totalSecondsPerDay)}/dia de exposição
                      </span>
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
              {/* Filtro por local */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Filtrar por local:</label>
                <select
                  value={selectedCondominiumId}
                  onChange={(e) => setSelectedCondominiumId(e.target.value)}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="all">Todos os locais</option>
                  {condominiums.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

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
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Dia</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Semana</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Mês</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Ano</th>
                        <th className="text-right py-2 px-3 font-medium text-gray-600">Tempo/Dia</th>
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
                    className="bg-gray-50 rounded-lg p-4"
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
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {report.commission}% comissão
                            </span>
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
        </div>
      </div>

      {/* Nota explicativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Como os cálculos são feitos:</p>
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
