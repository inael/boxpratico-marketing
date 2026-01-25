/**
 * QuoteService - Motor de Precificação e Cálculo de Audiência
 *
 * Calcula preços baseados em:
 * - Tier do terminal (GOLD, SILVER, BRONZE)
 * - Número de plays desejados
 * - Audiência estimada (tráfego diário)
 *
 * Fórmula: Preço = (Plays_Desejados * Preço_Base) * Multiplicador_Tier
 */

import { Monitor, TerminalTier, TERMINAL_TIER_CONFIG, calculateDistanceKm } from '@/types';

// ============================================
// CONFIGURAÇÃO DE PREÇOS
// ============================================

export interface PricingConfig {
  // Preço base por play (em centavos para evitar problemas de float)
  basePricePerPlayCents: number;
  // Preço mínimo mensal por tela
  minMonthlyPriceCents: number;
  // Desconto por volume (percentual)
  volumeDiscounts: {
    minScreens: number;
    discountPercent: number;
  }[];
}

// Configuração padrão de preços
export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  basePricePerPlayCents: 5, // R$ 0,05 por play
  minMonthlyPriceCents: 15000, // R$ 150,00 mínimo/mês por tela
  volumeDiscounts: [
    { minScreens: 5, discountPercent: 5 },
    { minScreens: 10, discountPercent: 10 },
    { minScreens: 20, discountPercent: 15 },
    { minScreens: 50, discountPercent: 20 },
  ],
};

// ============================================
// INTERFACES
// ============================================

export interface QuoteInput {
  // Terminais selecionados
  terminalIds: string[];
  // Ou filtro por raio geográfico
  geoFilter?: {
    centerLat: number;
    centerLng: number;
    radiusKm: number;
  };
  // Configuração da campanha
  playsPerDay: number;       // Quantidade de exibições por dia por terminal
  durationDays: number;      // Duração da campanha em dias
  slotDurationSec: number;   // Duração do slot em segundos (15, 30, 60)
}

export interface TerminalQuote {
  terminalId: string;
  terminalName: string;
  tier: TerminalTier;
  dailyTraffic: number;
  // Cálculos
  playsPerDay: number;
  pricePerPlayCents: number;
  dailyPriceCents: number;
  totalPriceCents: number;
  // Audiência
  estimatedDailyReach: number;
  estimatedTotalReach: number;
}

export interface QuoteResult {
  // Resumo
  totalTerminals: number;
  totalPlays: number;
  totalDays: number;
  // Audiência
  estimatedDailyReach: number;      // Pessoas impactadas por dia
  estimatedTotalReach: number;      // Total de pessoas impactadas
  estimatedImpressions: number;     // Total de impressões
  // Preços
  subtotalCents: number;
  volumeDiscountPercent: number;
  volumeDiscountCents: number;
  totalCents: number;
  monthlyEquivalentCents: number;
  // Detalhamento
  terminalQuotes: TerminalQuote[];
  // Metadata
  calculatedAt: string;
  pricingVersion: string;
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula o multiplicador de preço baseado no tier
 */
export function getTierMultiplier(tier: TerminalTier): number {
  return TERMINAL_TIER_CONFIG[tier]?.multiplier || 1.0;
}

/**
 * Calcula o desconto por volume baseado na quantidade de telas
 */
export function getVolumeDiscount(
  screenCount: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  let discount = 0;
  for (const tier of config.volumeDiscounts) {
    if (screenCount >= tier.minScreens) {
      discount = tier.discountPercent;
    }
  }
  return discount;
}

/**
 * Filtra terminais por raio geográfico
 */
export function filterTerminalsByRadius(
  terminals: Monitor[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Monitor[] {
  return terminals.filter((terminal) => {
    if (!terminal.latitude || !terminal.longitude) return false;
    const distance = calculateDistanceKm(
      centerLat,
      centerLng,
      terminal.latitude,
      terminal.longitude
    );
    return distance <= radiusKm;
  });
}

/**
 * Calcula quote para um único terminal
 */
export function calculateTerminalQuote(
  terminal: Monitor,
  playsPerDay: number,
  durationDays: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): TerminalQuote {
  const tier = terminal.tier || 'BRONZE';
  const multiplier = getTierMultiplier(tier);
  const dailyTraffic = terminal.averageDailyTraffic || 0;

  // Preço por play = base * multiplicador do tier
  const pricePerPlayCents = Math.round(config.basePricePerPlayCents * multiplier);

  // Preço diário = plays * preço por play
  let dailyPriceCents = playsPerDay * pricePerPlayCents;

  // Garantir preço mínimo diário (proporcional ao mensal)
  const minDailyPriceCents = Math.round(config.minMonthlyPriceCents / 30);
  if (dailyPriceCents < minDailyPriceCents) {
    dailyPriceCents = minDailyPriceCents;
  }

  // Preço total do período
  const totalPriceCents = dailyPriceCents * durationDays;

  // Estimativa de audiência (assume 70% de chance de ver a tela)
  const viewRate = 0.7;
  const estimatedDailyReach = Math.round(dailyTraffic * viewRate);
  const estimatedTotalReach = estimatedDailyReach * durationDays;

  return {
    terminalId: terminal.id,
    terminalName: terminal.name,
    tier,
    dailyTraffic,
    playsPerDay,
    pricePerPlayCents,
    dailyPriceCents,
    totalPriceCents,
    estimatedDailyReach,
    estimatedTotalReach,
  };
}

/**
 * Calcula quote completo para múltiplos terminais
 */
export function calculateQuote(
  terminals: Monitor[],
  input: Omit<QuoteInput, 'terminalIds' | 'geoFilter'>,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): QuoteResult {
  const { playsPerDay, durationDays } = input;

  // Calcular quote individual para cada terminal
  const terminalQuotes = terminals.map((t) =>
    calculateTerminalQuote(t, playsPerDay, durationDays, config)
  );

  // Somar totais
  const subtotalCents = terminalQuotes.reduce((sum, q) => sum + q.totalPriceCents, 0);
  const totalPlays = terminals.length * playsPerDay * durationDays;

  // Audiência total (com deduplicação estimada de 20%)
  const rawDailyReach = terminalQuotes.reduce((sum, q) => sum + q.estimatedDailyReach, 0);
  const deduplicationFactor = terminals.length > 1 ? 0.8 : 1.0;
  const estimatedDailyReach = Math.round(rawDailyReach * deduplicationFactor);
  const estimatedTotalReach = estimatedDailyReach * durationDays;
  const estimatedImpressions = totalPlays;

  // Desconto por volume
  const volumeDiscountPercent = getVolumeDiscount(terminals.length, config);
  const volumeDiscountCents = Math.round(subtotalCents * (volumeDiscountPercent / 100));
  const totalCents = subtotalCents - volumeDiscountCents;

  // Equivalente mensal (para comparação)
  const monthlyEquivalentCents = durationDays > 0
    ? Math.round((totalCents / durationDays) * 30)
    : 0;

  return {
    totalTerminals: terminals.length,
    totalPlays,
    totalDays: durationDays,
    estimatedDailyReach,
    estimatedTotalReach,
    estimatedImpressions,
    subtotalCents,
    volumeDiscountPercent,
    volumeDiscountCents,
    totalCents,
    monthlyEquivalentCents,
    terminalQuotes,
    calculatedAt: new Date().toISOString(),
    pricingVersion: '1.0.0',
  };
}

/**
 * Formata valor em centavos para Real brasileiro
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

/**
 * Formata número grande com sufixo (K, M)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

// ============================================
// COMISSÃO DO VENDEDOR (SALES_AGENT)
// ============================================

export interface SalesAgentCommission {
  rate: number;              // Taxa aplicada (%)
  estimatedValue: number;    // Valor estimado da comissão em centavos
  perDay: number;            // Comissão por dia de campanha em centavos
  formatted: string;         // Valor formatado em R$
  note: string;              // Ex: "Baseado em 15% sobre R$ 10.000"
}

export interface TimeMultiplier {
  factor: number;            // Ex: 2.0 para slot de 30s (base 15s)
  explanation: string;       // Ex: "Slot de 30s = 2x o valor base"
  baseSlotSec: number;       // Duração base (15s)
  actualSlotSec: number;     // Duração escolhida
}

export interface QuoteWithCommission extends QuoteResult {
  // Comissão do vendedor (calculada em tempo real)
  salesAgentCommission: SalesAgentCommission;
  // Multiplicador de tempo
  timeMultiplier: TimeMultiplier;
}

// Duração base do slot em segundos
const BASE_SLOT_DURATION_SEC = 15;

// Taxa padrão de comissão do vendedor (%)
const DEFAULT_SALES_AGENT_RATE = 15;

/**
 * Calcula o multiplicador de tempo baseado na duração do slot
 * Slots maiores = maior valor = maior comissão
 *
 * Exemplo:
 * - Slot 15s (base) → multiplicador 1.0x
 * - Slot 30s → multiplicador 2.0x
 * - Slot 60s → multiplicador 4.0x
 */
export function calculateTimeMultiplier(slotDurationSec: number): TimeMultiplier {
  const factor = slotDurationSec / BASE_SLOT_DURATION_SEC;

  let explanation: string;
  if (factor === 1) {
    explanation = `Slot de ${slotDurationSec}s (padrão)`;
  } else if (factor > 1) {
    explanation = `Slot de ${slotDurationSec}s = ${factor}x o valor base`;
  } else {
    explanation = `Slot de ${slotDurationSec}s = ${(factor * 100).toFixed(0)}% do valor base`;
  }

  return {
    factor,
    explanation,
    baseSlotSec: BASE_SLOT_DURATION_SEC,
    actualSlotSec: slotDurationSec,
  };
}

/**
 * Calcula a comissão estimada do vendedor
 *
 * REGRA DE OURO (Time-Value):
 * A comissão já considera o multiplicador de tempo embutido no preço total.
 * Se o vendedor altera de 15s para 30s, o preço dobra e a comissão dobra.
 */
export function calculateSalesAgentCommission(
  totalCents: number,
  durationDays: number,
  commissionRate: number = DEFAULT_SALES_AGENT_RATE
): SalesAgentCommission {
  const estimatedValueCents = Math.round((totalCents * commissionRate) / 100);
  const perDayCents = durationDays > 0
    ? Math.round(estimatedValueCents / durationDays)
    : 0;

  return {
    rate: commissionRate,
    estimatedValue: estimatedValueCents,
    perDay: perDayCents,
    formatted: formatCurrency(estimatedValueCents),
    note: `Baseado em ${commissionRate}% sobre ${formatCurrency(totalCents)}`,
  };
}

/**
 * Calcula quote completo COM comissão do vendedor e multiplicador de tempo
 * Esta é a função que deve ser usada no Simulador de Vendas
 */
export function calculateQuoteWithCommission(
  terminals: Monitor[],
  input: Omit<QuoteInput, 'terminalIds' | 'geoFilter'>,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  salesAgentCommissionRate: number = DEFAULT_SALES_AGENT_RATE
): QuoteWithCommission {
  const { slotDurationSec } = input;

  // Calcular multiplicador de tempo
  const timeMultiplier = calculateTimeMultiplier(slotDurationSec);

  // Ajustar config com multiplicador de tempo
  const adjustedConfig: PricingConfig = {
    ...config,
    basePricePerPlayCents: Math.round(config.basePricePerPlayCents * timeMultiplier.factor),
    minMonthlyPriceCents: Math.round(config.minMonthlyPriceCents * timeMultiplier.factor),
  };

  // Calcular quote base com preços ajustados pelo tempo
  const baseQuote = calculateQuote(terminals, input, adjustedConfig);

  // Calcular comissão do vendedor sobre o valor total
  const salesAgentCommission = calculateSalesAgentCommission(
    baseQuote.totalCents,
    input.durationDays,
    salesAgentCommissionRate
  );

  return {
    ...baseQuote,
    salesAgentCommission,
    timeMultiplier,
  };
}

/**
 * Retorna um resumo formatado do quote para exibição
 */
export function formatQuoteSummary(quote: QuoteWithCommission): {
  totalFormatted: string;
  commissionFormatted: string;
  perDayFormatted: string;
  audienceFormatted: string;
  playsFormatted: string;
  timeMultiplierText: string;
} {
  return {
    totalFormatted: formatCurrency(quote.totalCents),
    commissionFormatted: quote.salesAgentCommission.formatted,
    perDayFormatted: formatCurrency(quote.salesAgentCommission.perDay),
    audienceFormatted: formatLargeNumber(quote.estimatedTotalReach),
    playsFormatted: formatLargeNumber(quote.totalPlays),
    timeMultiplierText: quote.timeMultiplier.explanation,
  };
}
