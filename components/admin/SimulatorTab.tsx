'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  MapPin,
  Monitor,
  Clock,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import PageHeader from './PageHeader';

interface Terminal {
  id: string;
  name: string;
  locationName: string;
  locationCity: string;
  audienceCategory: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  avgDailyAudience: number;
}

interface SimulatorConfig {
  pricePerPlay: number;
  slotDuration: number;
  playsPerHour: number;
  operatingHours: number;
  commissionRate: number;
}

export default function SimulatorTab() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SimulatorConfig>({
    pricePerPlay: 0.10,
    slotDuration: 15,
    playsPerHour: 4,
    operatingHours: 12,
    commissionRate: 15,
  });

  // Filtros de selecao
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(10);
  const [city, setCity] = useState('');

  // Configuracao da campanha
  const [durationDays, setDurationDays] = useState(30);
  const [slotSeconds, setSlotSeconds] = useState(15);
  const [playsPerDay, setPlaysPerDay] = useState(48);

  // UI states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [terminalsRes, settingsRes] = await Promise.all([
        fetch('/api/monitors'),
        fetch('/api/settings'),
      ]);

      if (terminalsRes.ok) {
        const data = await terminalsRes.json();
        // Mapear monitores para terminais com dados de audiencia
        const mappedTerminals: Terminal[] = data.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          name: m.name as string,
          locationName: (m.condominiumName as string) || 'Local',
          locationCity: (m.city as string) || 'Nao informado',
          audienceCategory: (m.audienceCategory as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM') || 'BRONZE',
          avgDailyAudience: (m.avgDailyAudience as number) || 500,
        }));
        setTerminals(mappedTerminals);
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.networkPricing) {
          setConfig(prev => ({
            ...prev,
            playsPerHour: settings.networkPricing.insertionsPerHour || 4,
            operatingHours: settings.networkPricing.operatingHoursPerDay || 12,
          }));
        }
        if (settings.systemPricing) {
          setConfig(prev => ({
            ...prev,
            pricePerPlay: settings.systemPricing.basePricePerPlay || 0.10,
            commissionRate: settings.systemPricing.salesAgentCommission || 15,
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filtrar terminais por cidade
  const filteredTerminals = useMemo(() => {
    if (!city) return terminals;
    return terminals.filter(t =>
      t.locationCity.toLowerCase().includes(city.toLowerCase())
    );
  }, [terminals, city]);

  // Calculos do simulador
  const calculation = useMemo(() => {
    const selected = selectedTerminals.length > 0
      ? terminals.filter(t => selectedTerminals.includes(t.id))
      : filteredTerminals;

    const numTerminals = selected.length;
    const totalDailyAudience = selected.reduce((sum, t) => sum + t.avgDailyAudience, 0);

    // Multiplicador por duracao do slot
    const slotMultiplier = slotSeconds / config.slotDuration;

    // Plays totais
    const totalPlays = numTerminals * playsPerDay * durationDays;

    // Valor total
    const totalValue = totalPlays * config.pricePerPlay * slotMultiplier;

    // Comissao do vendedor
    const commission = totalValue * (config.commissionRate / 100);

    // Impressoes estimadas (plays * audiencia media)
    const avgAudiencePerTerminal = numTerminals > 0 ? totalDailyAudience / numTerminals : 0;
    const estimatedImpressions = totalPlays * avgAudiencePerTerminal;

    // CPM (custo por mil impressoes)
    const cpm = estimatedImpressions > 0 ? (totalValue / estimatedImpressions) * 1000 : 0;

    return {
      numTerminals,
      totalDailyAudience,
      totalPlays,
      totalValue,
      commission,
      estimatedImpressions,
      cpm,
      dailyValue: durationDays > 0 ? totalValue / durationDays : 0,
    };
  }, [selectedTerminals, filteredTerminals, terminals, durationDays, slotSeconds, playsPerDay, config]);

  const toggleTerminal = (id: string) => {
    setSelectedTerminals(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedTerminals(filteredTerminals.map(t => t.id));
  };

  const deselectAll = () => {
    setSelectedTerminals([]);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PLATINUM': return 'bg-purple-100 text-purple-700';
      case 'GOLD': return 'bg-amber-100 text-amber-700';
      case 'SILVER': return 'bg-gray-100 text-gray-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        title="Simulador de Campanha"
        helpTitle="Simulador de Orcamento"
        helpDescription="Simule orcamentos de campanhas. Selecione terminais, configure parametros e veja o valor estimado."
      />

      {/* Resumo Rapido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Monitor className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{calculation.numTerminals}</p>
              <p className="text-sm text-gray-500">Terminais</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculation.totalValue)}</p>
              <p className="text-sm text-gray-500">Valor Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculation.commission)}</p>
              <p className="text-sm text-gray-500">Sua Comissao ({config.commissionRate}%)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(calculation.estimatedImpressions)}</p>
              <p className="text-sm text-gray-500">Impressoes Est.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuracao da Campanha */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Configurar Campanha
              </h3>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duracao (dias)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={365}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duracao do Slot (segundos)
                </label>
                <select
                  value={slotSeconds}
                  onChange={(e) => setSlotSeconds(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={10}>10 segundos</option>
                  <option value={15}>15 segundos</option>
                  <option value={30}>30 segundos</option>
                  <option value={60}>60 segundos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exibicoes por Dia
                </label>
                <input
                  type="number"
                  value={playsPerDay}
                  onChange={(e) => setPlaysPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={1000}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recomendado: {config.playsPerHour * config.operatingHours} plays/dia ({config.playsPerHour}/hora x {config.operatingHours}h)
                </p>
              </div>

              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Configuracoes Avancadas
              </button>

              {showAdvanced && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preco por Play (R$)
                    </label>
                    <input
                      type="number"
                      value={config.pricePerPlay}
                      onChange={(e) => setConfig({ ...config, pricePerPlay: parseFloat(e.target.value) || 0.10 })}
                      step={0.01}
                      min={0.01}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taxa de Comissao (%)
                    </label>
                    <input
                      type="number"
                      value={config.commissionRate}
                      onChange={(e) => setConfig({ ...config, commissionRate: parseFloat(e.target.value) || 15 })}
                      step={0.5}
                      min={0}
                      max={100}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo Detalhado */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Resumo da Proposta
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/80">Terminais Selecionados</span>
                <span className="font-semibold">{calculation.numTerminals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Total de Exibicoes</span>
                <span className="font-semibold">{formatNumber(calculation.totalPlays)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">Audiencia Diaria Total</span>
                <span className="font-semibold">{formatNumber(calculation.totalDailyAudience)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/80">CPM Estimado</span>
                <span className="font-semibold">{formatCurrency(calculation.cpm)}</span>
              </div>

              <div className="border-t border-white/20 my-4"></div>

              <div className="flex justify-between text-lg">
                <span className="text-white/80">Valor Diario</span>
                <span className="font-bold">{formatCurrency(calculation.dailyValue)}</span>
              </div>
              <div className="flex justify-between text-xl">
                <span>Valor Total</span>
                <span className="font-bold">{formatCurrency(calculation.totalValue)}</span>
              </div>

              <div className="bg-white/20 rounded-lg p-3 mt-4">
                <div className="flex justify-between">
                  <span className="text-white/80">Sua Comissao</span>
                  <span className="font-bold text-lg">{formatCurrency(calculation.commission)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selecao de Terminais */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Selecionar Terminais
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                  >
                    Selecionar Todos
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-3 py-1.5 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    Limpar
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Filtrar por cidade..."
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
              {filteredTerminals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum terminal encontrado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTerminals.map((terminal) => (
                    <label
                      key={terminal.id}
                      className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedTerminals.includes(terminal.id) ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTerminals.includes(terminal.id)}
                        onChange={() => toggleTerminal(terminal.id)}
                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{terminal.name}</p>
                        <p className="text-sm text-gray-500 truncate">{terminal.locationName}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(terminal.audienceCategory)}`}>
                          {terminal.audienceCategory}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatNumber(terminal.avgDailyAudience)} pessoas/dia
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {selectedTerminals.length > 0
                    ? `${selectedTerminals.length} de ${filteredTerminals.length} terminais selecionados`
                    : `${filteredTerminals.length} terminais disponiveis (todos serao considerados)`
                  }
                </span>
                <div className="flex items-center gap-1 text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>Se nenhum for selecionado, todos serao usados</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
