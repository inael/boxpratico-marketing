/**
 * Settlement Service - Fechamento Financeiro Mensal
 *
 * Este serviço calcula e gera os registros de pagamento para:
 * - LOCATION_OWNER: Revenue share baseado em plays reais com valor financeiro
 * - SALES_AGENT: Comissão sobre contratos fechados
 *
 * REGRA CRÍTICA (Time-Value):
 * O cálculo NÃO é baseado apenas em contagem de plays.
 * Cada play tem um valor financeiro proporcional à campanha.
 *
 * Exemplo:
 * - Campanha de R$ 1.000 com meta de 10.000 plays → cada play vale R$ 0,10
 * - Se parceiro tem 10% de revenue share → ganha R$ 0,01 por play
 */

import {
  Settlement,
  SettlementDetail,
  SettlementType,
  GenerateSettlementsInput,
  GenerateSettlementsResult,
  PlayLog,
  PlayLogSummary,
  DEFAULT_PLATFORM_SETTINGS,
  PlatformSettings,
} from '@/types';

// ============================================
// INTERFACES INTERNAS
// ============================================

interface LocationOwnerData {
  id: string;
  name: string;
  email?: string;
  commissionRate: number;     // % de revenue share
  terminalIds: string[];      // Terminais vinculados
}

interface SalesAgentData {
  id: string;
  name: string;
  email?: string;
  commissionRate: number;     // % de comissão
}

interface CampaignFinancialData {
  campaignId: string;
  campaignName: string;
  advertiserId: string;
  advertiserName: string;
  totalBudget: number;        // Valor total da campanha
  totalPlaysTarget: number;   // Meta de plays
  valuePerPlay: number;       // Valor unitário (budget / target)
}

// ============================================
// FUNÇÕES DE CÁLCULO
// ============================================

/**
 * Calcula o valor financeiro de um conjunto de PlayLogs
 * considerando o valor real de cada exibição
 */
export function calculatePlayLogsValue(playLogs: PlayLog[]): {
  totalPlays: number;
  totalDurationSeconds: number;
  totalValue: number;
} {
  return playLogs.reduce(
    (acc, log) => ({
      totalPlays: acc.totalPlays + 1,
      totalDurationSeconds: acc.totalDurationSeconds + log.durationSeconds,
      totalValue: acc.totalValue + log.valuePerPlay,
    }),
    { totalPlays: 0, totalDurationSeconds: 0, totalValue: 0 }
  );
}

/**
 * Agrupa PlayLogs por campanha para detalhamento
 */
export function groupPlayLogsByCampaign(playLogs: PlayLog[]): Map<string, PlayLog[]> {
  const grouped = new Map<string, PlayLog[]>();

  for (const log of playLogs) {
    const key = log.campaignId || 'NO_CAMPAIGN';
    const existing = grouped.get(key) || [];
    existing.push(log);
    grouped.set(key, existing);
  }

  return grouped;
}

/**
 * Calcula o valor por play de uma campanha
 * Fórmula: totalBudget / totalPlaysTarget
 */
export function calculateCampaignValuePerPlay(
  totalBudget: number,
  totalPlaysTarget: number
): number {
  if (totalPlaysTarget <= 0) return 0;
  return totalBudget / totalPlaysTarget;
}

// ============================================
// SETTLEMENT PARA LOCATION_OWNER
// ============================================

/**
 * Gera settlement para um parceiro de local (LOCATION_OWNER)
 *
 * Lógica:
 * 1. Busca todos os PlayLogs do mês para os terminais do parceiro
 * 2. Para cada play, usa o valuePerPlay já calculado no momento da exibição
 * 3. Soma o valor total (grossValue)
 * 4. Aplica a taxa de comissão do parceiro
 * 5. Gera o settlement com detalhamento por campanha
 */
export function generateLocationOwnerSettlement(
  owner: LocationOwnerData,
  playLogs: PlayLog[],
  campaigns: Map<string, CampaignFinancialData>,
  referenceMonth: string,
  tenantId: string
): Settlement {
  const periodStart = `${referenceMonth}-01`;
  const periodEnd = getLastDayOfMonth(referenceMonth);

  // Filtrar apenas logs dos terminais deste parceiro
  const ownerLogs = playLogs.filter((log) =>
    owner.terminalIds.includes(log.terminalId)
  );

  // Calcular totais
  const totals = calculatePlayLogsValue(ownerLogs);

  // Calcular valor líquido
  const netValue = (totals.totalValue * owner.commissionRate) / 100;

  // Gerar detalhamento por campanha
  const details: SettlementDetail[] = [];
  const groupedLogs = groupPlayLogsByCampaign(ownerLogs);

  for (const [campaignId, logs] of groupedLogs) {
    const campaignTotals = calculatePlayLogsValue(logs);
    const campaign = campaigns.get(campaignId);

    details.push({
      id: generateId(),
      settlementId: '', // Será preenchido após criar o settlement
      campaignId: campaignId === 'NO_CAMPAIGN' ? undefined : campaignId,
      campaignName: campaign?.campaignName || 'Sem campanha',
      advertiserId: campaign?.advertiserId,
      advertiserName: campaign?.advertiserName || 'N/A',
      grossValue: campaignTotals.totalValue,
      commissionRate: owner.commissionRate,
      netValue: (campaignTotals.totalValue * owner.commissionRate) / 100,
      totalPlays: campaignTotals.totalPlays,
      totalDurationSeconds: campaignTotals.totalDurationSeconds,
    });
  }

  const settlementId = generateId();

  // Atualizar settlementId nos details
  details.forEach((d) => (d.settlementId = settlementId));

  return {
    id: settlementId,
    tenantId,
    type: 'LOCATION_OWNER',
    beneficiaryId: owner.id,
    beneficiaryName: owner.name,
    beneficiaryEmail: owner.email,
    referenceMonth,
    periodStart,
    periodEnd,
    grossValue: totals.totalValue,
    commissionRate: owner.commissionRate,
    netValue: Math.round(netValue * 100) / 100, // Arredondar para centavos
    totalPlays: totals.totalPlays,
    details,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// SETTLEMENT PARA SALES_AGENT
// ============================================

interface ContractData {
  id: string;
  name: string;
  advertiserId: string;
  advertiserName: string;
  salesAgentId: string;
  totalValue: number;
  signedAt: string;
}

/**
 * Gera settlement para um vendedor (SALES_AGENT)
 *
 * Lógica:
 * 1. Busca todos os contratos fechados no mês pelo vendedor
 * 2. Soma o valor total dos contratos
 * 3. Aplica a taxa de comissão do vendedor
 * 4. Gera o settlement com detalhamento por contrato
 */
export function generateSalesAgentSettlement(
  agent: SalesAgentData,
  contracts: ContractData[],
  referenceMonth: string,
  tenantId: string
): Settlement {
  const periodStart = `${referenceMonth}-01`;
  const periodEnd = getLastDayOfMonth(referenceMonth);

  // Filtrar contratos do período e do agente
  const agentContracts = contracts.filter((c) => {
    const contractMonth = c.signedAt.substring(0, 7); // YYYY-MM
    return c.salesAgentId === agent.id && contractMonth === referenceMonth;
  });

  // Calcular valor bruto (soma dos contratos)
  const grossValue = agentContracts.reduce((sum, c) => sum + c.totalValue, 0);

  // Calcular valor líquido (comissão)
  const netValue = (grossValue * agent.commissionRate) / 100;

  // Gerar detalhamento por contrato
  const details: SettlementDetail[] = agentContracts.map((contract) => ({
    id: generateId(),
    settlementId: '', // Será preenchido após criar o settlement
    contractId: contract.id,
    contractName: contract.name,
    advertiserId: contract.advertiserId,
    advertiserName: contract.advertiserName,
    grossValue: contract.totalValue,
    commissionRate: agent.commissionRate,
    netValue: (contract.totalValue * agent.commissionRate) / 100,
    contractValue: contract.totalValue,
  }));

  const settlementId = generateId();

  // Atualizar settlementId nos details
  details.forEach((d) => (d.settlementId = settlementId));

  return {
    id: settlementId,
    tenantId,
    type: 'SALES_AGENT',
    beneficiaryId: agent.id,
    beneficiaryName: agent.name,
    beneficiaryEmail: agent.email,
    referenceMonth,
    periodStart,
    periodEnd,
    grossValue,
    commissionRate: agent.commissionRate,
    netValue: Math.round(netValue * 100) / 100,
    totalContracts: agentContracts.length,
    details,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getLastDayOfMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return `${yearMonth}-${lastDay.toString().padStart(2, '0')}`;
}

/**
 * Valida se um mês está no formato correto (YYYY-MM)
 */
export function validateReferenceMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

/**
 * Retorna o mês anterior no formato YYYY-MM
 */
export function getPreviousMonth(current?: string): string {
  const date = current ? new Date(`${current}-01`) : new Date();
  date.setMonth(date.getMonth() - 1);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Retorna o mês atual no formato YYYY-MM
 */
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================
// SERVIÇO PRINCIPAL
// ============================================

/**
 * Classe principal do serviço de settlement
 * Orquestra a geração de fechamentos financeiros
 */
export class SettlementService {
  private platformSettings: PlatformSettings;

  constructor(settings?: Partial<PlatformSettings>) {
    this.platformSettings = {
      id: 'platform-settings',
      ...DEFAULT_PLATFORM_SETTINGS,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Gera todos os settlements para um tenant em um mês
   */
  async generateAllSettlements(
    input: GenerateSettlementsInput,
    locationOwners: LocationOwnerData[],
    salesAgents: SalesAgentData[],
    playLogs: PlayLog[],
    campaigns: Map<string, CampaignFinancialData>,
    contracts: ContractData[]
  ): Promise<GenerateSettlementsResult> {
    const settlements: Settlement[] = [];
    const errors: string[] = [];

    // Validar mês
    if (!validateReferenceMonth(input.referenceMonth)) {
      return {
        success: false,
        settlements: [],
        totalGrossValue: 0,
        totalNetValue: 0,
        beneficiariesCount: 0,
        errors: ['Mês de referência inválido. Use o formato YYYY-MM'],
      };
    }

    try {
      if (input.type === 'LOCATION_OWNER' || !input.type) {
        // Gerar settlements para parceiros de local
        for (const owner of locationOwners) {
          try {
            const settlement = generateLocationOwnerSettlement(
              owner,
              playLogs,
              campaigns,
              input.referenceMonth,
              input.tenantId
            );

            // Só incluir se houver valor
            if (settlement.grossValue > 0) {
              settlements.push(settlement);
            }
          } catch (err) {
            errors.push(`Erro ao processar ${owner.name}: ${err}`);
          }
        }
      }

      if (input.type === 'SALES_AGENT' || !input.type) {
        // Gerar settlements para vendedores
        for (const agent of salesAgents) {
          try {
            const settlement = generateSalesAgentSettlement(
              agent,
              contracts,
              input.referenceMonth,
              input.tenantId
            );

            // Só incluir se houver valor
            if (settlement.grossValue > 0) {
              settlements.push(settlement);
            }
          } catch (err) {
            errors.push(`Erro ao processar ${agent.name}: ${err}`);
          }
        }
      }

      // Calcular totais
      const totalGrossValue = settlements.reduce((sum, s) => sum + s.grossValue, 0);
      const totalNetValue = settlements.reduce((sum, s) => sum + s.netValue, 0);

      return {
        success: errors.length === 0,
        settlements,
        totalGrossValue,
        totalNetValue,
        beneficiariesCount: settlements.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err) {
      return {
        success: false,
        settlements: [],
        totalGrossValue: 0,
        totalNetValue: 0,
        beneficiariesCount: 0,
        errors: [`Erro geral: ${err}`],
      };
    }
  }

  /**
   * Calcula o valor de comissão estimado para o vendedor
   * Usado no simulador em tempo real
   */
  calculateSalesAgentEstimatedCommission(
    contractValue: number,
    commissionRate?: number
  ): {
    rate: number;
    value: number;
    note: string;
  } {
    const rate = commissionRate ?? this.platformSettings.salesAgentDefaultCommission;
    const value = (contractValue * rate) / 100;

    return {
      rate,
      value: Math.round(value * 100) / 100,
      note: `Baseado em ${rate}% sobre ${formatCurrency(contractValue)}`,
    };
  }
}

/**
 * Formata valor em moeda brasileira
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
