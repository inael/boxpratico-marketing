'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Target,
  Users,
  DollarSign,
  Monitor,
  Play,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { formatCurrency, formatLargeNumber, QuoteResult } from '@/lib/quote-service';
import { TERMINAL_TIER_CONFIG, TerminalTier } from '@/types';

interface Terminal {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  tier: TerminalTier;
  dailyTraffic: number;
  address?: string;
  city?: string;
  state?: string;
  isOnline?: boolean;
}

interface CampaignSimulatorProps {
  onCreateCampaign?: (quote: QuoteResult, selectedTerminals: string[]) => void;
}

export default function CampaignSimulator({ onCreateCampaign }: CampaignSimulatorProps) {
  // Estados
  const [step, setStep] = useState<'location' | 'config' | 'result'>('location');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtro geográfico
  const [centerLat, setCenterLat] = useState<number>(-23.5505); // São Paulo
  const [centerLng, setCenterLng] = useState<number>(-46.6333);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [centerAddress, setCenterAddress] = useState<string>('');

  // Terminais
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [selectedTerminals, setSelectedTerminals] = useState<string[]>([]);

  // Configuração da campanha
  const [playsPerDay, setPlaysPerDay] = useState<number>(48);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [slotDurationSec, setSlotDurationSec] = useState<number>(15);

  // Resultado
  const [quote, setQuote] = useState<QuoteResult | null>(null);

  // Buscar terminais quando filtro mudar
  const fetchTerminals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        lat: centerLat.toString(),
        lng: centerLng.toString(),
        radius: radiusKm.toString(),
      });

      const res = await fetch(`/api/quotes?${params}`);
      if (!res.ok) throw new Error('Falha ao buscar terminais');

      const data = await res.json();
      setTerminals(data.terminals || []);
      // Selecionar todos por padrão
      setSelectedTerminals((data.terminals || []).map((t: Terminal) => t.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar terminais');
    } finally {
      setLoading(false);
    }
  }, [centerLat, centerLng, radiusKm]);

  // Calcular orçamento
  const calculateQuote = async () => {
    if (selectedTerminals.length === 0) {
      setError('Selecione pelo menos um terminal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terminalIds: selectedTerminals,
          playsPerDay,
          durationDays,
          slotDurationSec,
        }),
      });

      if (!res.ok) throw new Error('Falha ao calcular orçamento');

      const data = await res.json();
      setQuote(data);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Toggle seleção de terminal
  const toggleTerminal = (id: string) => {
    setSelectedTerminals((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Selecionar todos/nenhum
  const selectAll = () => setSelectedTerminals(terminals.map((t) => t.id));
  const selectNone = () => setSelectedTerminals([]);

  // Estatísticas dos terminais selecionados
  const selectedStats = {
    count: selectedTerminals.length,
    gold: terminals.filter((t) => selectedTerminals.includes(t.id) && t.tier === 'GOLD').length,
    silver: terminals.filter((t) => selectedTerminals.includes(t.id) && t.tier === 'SILVER').length,
    bronze: terminals.filter((t) => selectedTerminals.includes(t.id) && t.tier === 'BRONZE').length,
    totalTraffic: terminals
      .filter((t) => selectedTerminals.includes(t.id))
      .reduce((sum, t) => sum + t.dailyTraffic, 0),
  };

  // Buscar terminais ao montar
  useEffect(() => {
    fetchTerminals();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Simulador de Campanhas</h2>
            <p className="text-indigo-100 text-sm">Calcule alcance e investimento em tempo real</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 py-4 border-b border-gray-100">
        {[
          { id: 'location', label: 'Localização', icon: MapPin },
          { id: 'config', label: 'Configurar', icon: Play },
          { id: 'result', label: 'Resultado', icon: CheckCircle },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center">
            {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300 mx-2" />}
            <button
              onClick={() => s.id !== 'result' && setStep(s.id as 'location' | 'config')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step === s.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Location */}
        {step === 'location' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Filtro por Raio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mapa Placeholder */}
              <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center p-6">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Mapa Interativo</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Clique para definir o centro ou use as coordenadas
                  </p>
                </div>
              </div>

              {/* Controles */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Endereço do Cliente
                  </label>
                  <input
                    type="text"
                    value={centerAddress}
                    onChange={(e) => setCenterAddress(e.target.value)}
                    placeholder="Av. Paulista, 1000 - São Paulo"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={centerLat}
                      onChange={(e) => setCenterLat(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={centerLng}
                      onChange={(e) => setCenterLng(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Raio de Alcance: <span className="text-indigo-600">{radiusKm} km</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>1 km</span>
                    <span>50 km</span>
                  </div>
                </div>

                <button
                  onClick={fetchTerminals}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                  Buscar Terminais
                </button>
              </div>
            </div>

            {/* Lista de Terminais */}
            {terminals.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    Terminais Encontrados ({terminals.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Selecionar todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={selectNone}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {terminals.map((terminal) => (
                    <button
                      key={terminal.id}
                      onClick={() => toggleTerminal(terminal.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                        selectedTerminals.includes(terminal.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                        style={{ backgroundColor: TERMINAL_TIER_CONFIG[terminal.tier]?.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {terminal.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {terminal.city}, {terminal.state}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatLargeNumber(terminal.dailyTraffic)} pessoas/dia
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium">{selectedStats.count} selecionadas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TERMINAL_TIER_CONFIG.GOLD.color }}
                    />
                    <span className="text-xs text-gray-500">{selectedStats.gold}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TERMINAL_TIER_CONFIG.SILVER.color }}
                    />
                    <span className="text-xs text-gray-500">{selectedStats.silver}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: TERMINAL_TIER_CONFIG.BRONZE.color }}
                    />
                    <span className="text-xs text-gray-500">{selectedStats.bronze}</span>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-indigo-600">
                      {formatLargeNumber(selectedStats.totalTraffic)}/dia
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStep('config')}
                  disabled={selectedStats.count === 0}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Config */}
        {step === 'config' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Plays por dia */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Exibições por dia/tela
                </label>
                <select
                  value={playsPerDay}
                  onChange={(e) => setPlaysPerDay(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={24}>24x (1 por hora)</option>
                  <option value={48}>48x (2 por hora)</option>
                  <option value={96}>96x (4 por hora)</option>
                  <option value={144}>144x (6 por hora)</option>
                </select>
              </div>

              {/* Duração */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Duração da campanha
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={7}>1 semana</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>1 mês</option>
                  <option value={90}>3 meses</option>
                  <option value={180}>6 meses</option>
                  <option value={365}>1 ano</option>
                </select>
              </div>

              {/* Duração do slot */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Duração do anúncio
                </label>
                <select
                  value={slotDurationSec}
                  onChange={(e) => setSlotDurationSec(parseInt(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={10}>10 segundos</option>
                  <option value={15}>15 segundos</option>
                  <option value={30}>30 segundos</option>
                  <option value={60}>60 segundos</option>
                </select>
              </div>
            </div>

            {/* Resumo */}
            <div className="p-4 bg-indigo-50 rounded-xl">
              <h4 className="font-medium text-indigo-900 mb-2">Resumo da Seleção</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-indigo-600">Telas</p>
                  <p className="font-bold text-indigo-900">{selectedStats.count}</p>
                </div>
                <div>
                  <p className="text-indigo-600">Plays/dia</p>
                  <p className="font-bold text-indigo-900">
                    {formatLargeNumber(selectedStats.count * playsPerDay)}
                  </p>
                </div>
                <div>
                  <p className="text-indigo-600">Duração</p>
                  <p className="font-bold text-indigo-900">{durationDays} dias</p>
                </div>
                <div>
                  <p className="text-indigo-600">Audiência Est.</p>
                  <p className="font-bold text-indigo-900">
                    {formatLargeNumber(selectedStats.totalTraffic)}/dia
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('location')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={calculateQuote}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Calcular Orçamento
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && quote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Cards de Destaque */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Audiência */}
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Impacto Estimado</span>
                </div>
                <p className="text-3xl font-bold">
                  {formatLargeNumber(quote.estimatedDailyReach)}
                </p>
                <p className="text-green-100 text-sm">pessoas/dia</p>
                <p className="text-green-200 text-xs mt-2">
                  Total: {formatLargeNumber(quote.estimatedTotalReach)} pessoas
                </p>
              </div>

              {/* Impressões */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Impressões Totais</span>
                </div>
                <p className="text-3xl font-bold">
                  {formatLargeNumber(quote.estimatedImpressions)}
                </p>
                <p className="text-blue-100 text-sm">exibições</p>
                <p className="text-blue-200 text-xs mt-2">
                  {quote.totalTerminals} telas × {quote.totalDays} dias
                </p>
              </div>

              {/* Investimento */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-5 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-medium">Investimento</span>
                </div>
                <p className="text-3xl font-bold">
                  {formatCurrency(quote.totalCents)}
                </p>
                <p className="text-purple-100 text-sm">total</p>
                {quote.volumeDiscountPercent > 0 && (
                  <p className="text-green-300 text-xs mt-2">
                    -{quote.volumeDiscountPercent}% desconto por volume
                  </p>
                )}
              </div>
            </div>

            {/* Detalhamento */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h4 className="font-semibold text-gray-900 mb-4">Detalhamento do Orçamento</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(quote.subtotalCents)}</span>
                </div>
                {quote.volumeDiscountCents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto por volume ({quote.volumeDiscountPercent}%)</span>
                    <span>-{formatCurrency(quote.volumeDiscountCents)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-indigo-600">{formatCurrency(quote.totalCents)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Equivalente mensal</span>
                  <span>{formatCurrency(quote.monthlyEquivalentCents)}/mês</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('config')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ajustar Campanha
              </button>
              <button
                onClick={() => onCreateCampaign?.(quote, selectedTerminals)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Fechar Contrato
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
