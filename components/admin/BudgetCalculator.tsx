'use client';

import { useEffect, useState } from 'react';
import { Condominium, Monitor, TargetRadiusConfig, calculateDistanceKm } from '@/types';

interface NetworkPricing {
  pricePerDisplayMonth: number;
  insertionsPerHour: number;
  avgInsertionDurationSeconds: number;
  operatingHoursPerDay: number;
}

interface BudgetCalculatorProps {
  radiusConfig: TargetRadiusConfig | null;
  condominiums: Condominium[];
  monitors: Monitor[];
}

export default function BudgetCalculator({
  radiusConfig,
  condominiums,
  monitors,
}: BudgetCalculatorProps) {
  const [networkPricing, setNetworkPricing] = useState<NetworkPricing>({
    pricePerDisplayMonth: 20,
    insertionsPerHour: 4,
    avgInsertionDurationSeconds: 15,
    operatingHoursPerDay: 12,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetworkPricing();
  }, []);

  async function fetchNetworkPricing() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.networkPricing) {
        setNetworkPricing(data.networkPricing);
      }
    } catch (error) {
      console.error('Failed to fetch network pricing:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!radiusConfig) {
    return null;
  }

  // Calculate locations within radius
  const locationsWithinRadius = condominiums.filter((condo) => {
    if (!condo.latitude || !condo.longitude) return false;
    const distance = calculateDistanceKm(
      radiusConfig.centerLat,
      radiusConfig.centerLng,
      condo.latitude,
      condo.longitude
    );
    return distance <= radiusConfig.radiusKm;
  });

  // Calculate monitors within radius
  const locationIds = new Set(locationsWithinRadius.map((l) => l.id));
  const monitorsWithinRadius = monitors.filter(
    (m) => m.isActive && locationIds.has(m.condominiumId)
  );

  // Calculate total daily traffic
  const totalDailyTraffic = locationsWithinRadius.reduce(
    (sum, l) => sum + (l.averageDailyTraffic || 0),
    0
  );

  // Calculate costs and impressions
  const displayCount = monitorsWithinRadius.length;
  const monthlyPrice = displayCount * networkPricing.pricePerDisplayMonth;
  const dailyInsertions = networkPricing.insertionsPerHour * networkPricing.operatingHoursPerDay;
  const monthlyInsertions = dailyInsertions * 30 * displayCount;
  const dailyExposureMinutes =
    (dailyInsertions * networkPricing.avgInsertionDurationSeconds * displayCount) / 60;

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-blue-200 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-blue-200 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        <h4 className="font-bold text-blue-900">Calculadora de Orcamento</h4>
      </div>

      {displayCount === 0 ? (
        <div className="text-center py-4">
          <p className="text-blue-700 text-sm">
            Nenhum display encontrado no raio de {radiusConfig.radiusKm} km
          </p>
          <p className="text-blue-600 text-xs mt-1">
            Tente aumentar o raio ou verifique se os locais tem coordenadas cadastradas
          </p>
        </div>
      ) : (
        <>
          {/* Main metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Locais</p>
              <p className="text-2xl font-bold text-blue-900">{locationsWithinRadius.length}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Displays</p>
              <p className="text-2xl font-bold text-blue-900">{displayCount}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Alcance/dia</p>
              <p className="text-2xl font-bold text-blue-900">
                {totalDailyTraffic > 0
                  ? totalDailyTraffic.toLocaleString('pt-BR')
                  : '-'}
              </p>
              <p className="text-[10px] text-blue-500">pessoas</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center">
              <p className="text-xs text-blue-600 font-medium">Exposicao/dia</p>
              <p className="text-2xl font-bold text-blue-900">
                {Math.round(dailyExposureMinutes)}
              </p>
              <p className="text-[10px] text-blue-500">minutos</p>
            </div>
          </div>

          {/* Price highlight */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Investimento Mensal</p>
                <p className="text-3xl font-bold">
                  R$ {monthlyPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-sm">
                  R$ {networkPricing.pricePerDisplayMonth.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                  /display
                </p>
                <p className="text-xs text-green-200 mt-1">
                  {monthlyInsertions.toLocaleString('pt-BR')} insercoes/mes
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/50 rounded px-3 py-2">
              <span className="text-blue-600">Insercoes por hora:</span>
              <span className="ml-1 font-medium text-blue-900">
                {networkPricing.insertionsPerHour}x por display
              </span>
            </div>
            <div className="bg-white/50 rounded px-3 py-2">
              <span className="text-blue-600">Duracao media:</span>
              <span className="ml-1 font-medium text-blue-900">
                {networkPricing.avgInsertionDurationSeconds}s
              </span>
            </div>
            <div className="bg-white/50 rounded px-3 py-2">
              <span className="text-blue-600">Funcionamento:</span>
              <span className="ml-1 font-medium text-blue-900">
                {networkPricing.operatingHoursPerDay}h/dia
              </span>
            </div>
            <div className="bg-white/50 rounded px-3 py-2">
              <span className="text-blue-600">Insercoes/display/dia:</span>
              <span className="ml-1 font-medium text-blue-900">{dailyInsertions}</span>
            </div>
          </div>

          {/* Locations list */}
          {locationsWithinRadius.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-blue-700 mb-2">
                Locais incluidos no raio:
              </p>
              <div className="flex flex-wrap gap-1">
                {locationsWithinRadius.slice(0, 5).map((loc) => (
                  <span
                    key={loc.id}
                    className="px-2 py-1 bg-white/70 text-blue-800 text-xs rounded"
                  >
                    {loc.name}
                  </span>
                ))}
                {locationsWithinRadius.length > 5 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                    +{locationsWithinRadius.length - 5} mais
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
