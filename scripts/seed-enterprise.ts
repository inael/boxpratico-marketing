/**
 * Seed Script - Dados de Teste Enterprise
 *
 * Cria dados para testar as funcionalidades B2B2C:
 * - Tenant Corporativo (Hospital)
 * - Tenant Operador de Rede (Mídia Indoor)
 * - Terminais com geolocalização real de São Paulo
 * - Usuários com diferentes perfis
 *
 * Executar: npx ts-node --project tsconfig.json scripts/seed-enterprise.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');

// ============================================
// IDs
// ============================================

const IDS = {
  // Tenants/Accounts
  hospitalAccount: 'acc-hospital-001',
  midiaBoxAccount: 'acc-midiabox-001',

  // Usuários
  hospitalAdmin: 'user-hospital-admin',
  midiaBoxAdmin: 'user-midiabox-admin',
  midiaBoxVendedor: 'user-midiabox-vendedor',

  // Condominiums/Locations
  locationShopping: 'loc-shopping-001',
  locationMetro: 'loc-metro-001',
  locationHospital: 'loc-hospital-001',
  locationPadaria1: 'loc-padaria-001',
  locationPadaria2: 'loc-padaria-002',
  locationAcademia: 'loc-academia-001',
  locationFarmacia: 'loc-farmacia-001',
  locationClinica: 'loc-clinica-001',

  // Monitors/Terminals
  terminalShopping1: 'term-shopping-001',
  terminalShopping2: 'term-shopping-002',
  terminalShopping3: 'term-shopping-003',
  terminalMetro1: 'term-metro-001',
  terminalHospital1: 'term-hospital-001',
  terminalHospital2: 'term-hospital-002',
  terminalPadaria1: 'term-padaria-001',
  terminalPadaria2: 'term-padaria-002',
  terminalAcademia: 'term-academia-001',
  terminalFarmacia: 'term-farmacia-001',
  terminalClinica: 'term-clinica-001',
};

// ============================================
// DADOS
// ============================================

// Contas/Tenants
const accounts = [
  {
    id: IDS.hospitalAccount,
    name: 'Hospital Santa Vida',
    slug: 'hospital-santa-vida',
    type: 'CORPORATE_CLIENT', // TV interna, não vende publicidade
    ownerName: 'Dr. Roberto Mendes',
    email: 'admin@hospital.com',
    phone: '(11) 3333-0001',
    plan: 'pro',
    maxMonitors: 10,
    maxStorageMB: 5000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.midiaBoxAccount,
    name: 'Mídia Box SP',
    slug: 'midia-box-sp',
    type: 'NETWORK_OPERATOR', // Opera rede de telas e vende publicidade
    ownerName: 'Carlos Ferreira',
    email: 'admin@midiabox.com',
    phone: '(11) 3333-0002',
    plan: 'enterprise',
    maxMonitors: 100,
    maxStorageMB: 50000,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Usuários
async function createUsers() {
  const passwordHash = await bcrypt.hash('123456', 12);

  return [
    // Admin do Hospital (CORPORATE)
    {
      id: IDS.hospitalAdmin,
      name: 'Dr. Roberto Mendes',
      email: 'admin@hospital.com',
      passwordHash,
      role: 'TENANT_ADMIN',
      isAdmin: false,
      isActive: true,
      emailVerified: true,
      accountId: IDS.hospitalAccount,
      tenantId: IDS.hospitalAccount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Admin da Mídia Box (NETWORK_OPERATOR)
    {
      id: IDS.midiaBoxAdmin,
      name: 'Carlos Ferreira',
      email: 'admin@midiabox.com',
      passwordHash,
      role: 'TENANT_ADMIN',
      isAdmin: false,
      isActive: true,
      emailVerified: true,
      accountId: IDS.midiaBoxAccount,
      tenantId: IDS.midiaBoxAccount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    // Vendedor da Mídia Box
    {
      id: IDS.midiaBoxVendedor,
      name: 'Paulo Silva',
      email: 'vendedor@midiabox.com',
      passwordHash,
      role: 'SALES_AGENT',
      isAdmin: false,
      isActive: true,
      emailVerified: true,
      accountId: IDS.midiaBoxAccount,
      tenantId: IDS.midiaBoxAccount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Locais (Condominiums)
const condominiums = [
  // GOLD - Alto tráfego (Shopping e Metrô)
  {
    id: IDS.locationShopping,
    name: 'Shopping Ibirapuera',
    slug: 'shopping-ibirapuera',
    address: 'Av. Ibirapuera, 3103',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.6105,
    longitude: -46.6655,
    averageDailyTraffic: 50000,
    category: 'entretenimento',
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.locationMetro,
    name: 'Estação Sé',
    slug: 'estacao-se',
    address: 'Praça da Sé, s/n',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5505,
    longitude: -46.6333,
    averageDailyTraffic: 80000,
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Hospital (CORPORATE)
  {
    id: IDS.locationHospital,
    name: 'Hospital Santa Vida',
    slug: 'hospital-santa-vida',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5629,
    longitude: -46.6544,
    averageDailyTraffic: 3000,
    category: 'clinica',
    accountId: IDS.hospitalAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // SILVER - Médio tráfego (Bairros)
  {
    id: IDS.locationPadaria1,
    name: 'Padaria Brasileira - Pinheiros',
    slug: 'padaria-brasileira-pinheiros',
    address: 'Rua dos Pinheiros, 500',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5667,
    longitude: -46.6878,
    averageDailyTraffic: 800,
    category: 'alimentacao',
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.locationPadaria2,
    name: 'Padaria Brasileira - Moema',
    slug: 'padaria-brasileira-moema',
    address: 'Av. Moema, 300',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.6040,
    longitude: -46.6695,
    averageDailyTraffic: 600,
    category: 'alimentacao',
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.locationAcademia,
    name: 'Academia FitLife',
    slug: 'academia-fitlife',
    address: 'Rua Augusta, 1200',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5537,
    longitude: -46.6571,
    averageDailyTraffic: 400,
    category: 'academia',
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // BRONZE - Baixo tráfego
  {
    id: IDS.locationFarmacia,
    name: 'Farmácia Popular',
    slug: 'farmacia-popular',
    address: 'Rua da Consolação, 800',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5486,
    longitude: -46.6550,
    averageDailyTraffic: 200,
    category: 'farmacia',
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.locationClinica,
    name: 'Clínica Bem Estar',
    slug: 'clinica-bem-estar',
    address: 'Av. Brasil, 500',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5458,
    longitude: -46.6358,
    averageDailyTraffic: 150,
    category: 'clinica',
    accountId: IDS.midiaBoxAccount,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Terminais/Monitores
const monitors = [
  // GOLD - Shopping (3 telas)
  {
    id: IDS.terminalShopping1,
    name: 'Shopping Ibirapuera - Hall Principal',
    slug: 'shopping-ibirapuera-hall',
    location: 'Hall de Entrada',
    condominiumId: IDS.locationShopping,
    isActive: true,
    isOnline: true,
    orientation: 'vertical',
    latitude: -23.6105,
    longitude: -46.6655,
    address: 'Av. Ibirapuera, 3103 - Hall Principal',
    city: 'São Paulo',
    state: 'SP',
    tier: 'GOLD',
    averageDailyTraffic: 20000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalShopping2,
    name: 'Shopping Ibirapuera - Praça Alimentação',
    slug: 'shopping-ibirapuera-praca',
    location: 'Praça de Alimentação',
    condominiumId: IDS.locationShopping,
    isActive: true,
    isOnline: true,
    orientation: 'horizontal',
    latitude: -23.6107,
    longitude: -46.6658,
    address: 'Av. Ibirapuera, 3103 - Praça de Alimentação',
    city: 'São Paulo',
    state: 'SP',
    tier: 'GOLD',
    averageDailyTraffic: 15000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalShopping3,
    name: 'Shopping Ibirapuera - Estacionamento',
    slug: 'shopping-ibirapuera-estac',
    location: 'Estacionamento G1',
    condominiumId: IDS.locationShopping,
    isActive: true,
    isOnline: true,
    orientation: 'horizontal',
    latitude: -23.6103,
    longitude: -46.6650,
    address: 'Av. Ibirapuera, 3103 - Estacionamento',
    city: 'São Paulo',
    state: 'SP',
    tier: 'GOLD',
    averageDailyTraffic: 15000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // SILVER - Bairros
  {
    id: IDS.terminalPadaria1,
    name: 'Padaria Pinheiros - Entrada',
    slug: 'padaria-pinheiros-entrada',
    location: 'Entrada',
    condominiumId: IDS.locationPadaria1,
    isActive: true,
    isOnline: true,
    orientation: 'vertical',
    latitude: -23.5667,
    longitude: -46.6878,
    address: 'Rua dos Pinheiros, 500',
    city: 'São Paulo',
    state: 'SP',
    tier: 'SILVER',
    averageDailyTraffic: 800,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalPadaria2,
    name: 'Padaria Moema - Balcão',
    slug: 'padaria-moema-balcao',
    location: 'Balcão',
    condominiumId: IDS.locationPadaria2,
    isActive: true,
    isOnline: true,
    orientation: 'horizontal',
    latitude: -23.6040,
    longitude: -46.6695,
    address: 'Av. Moema, 300',
    city: 'São Paulo',
    state: 'SP',
    tier: 'SILVER',
    averageDailyTraffic: 600,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalAcademia,
    name: 'FitLife - Recepção',
    slug: 'fitlife-recepcao',
    location: 'Recepção',
    condominiumId: IDS.locationAcademia,
    isActive: true,
    isOnline: true,
    orientation: 'vertical',
    latitude: -23.5537,
    longitude: -46.6571,
    address: 'Rua Augusta, 1200',
    city: 'São Paulo',
    state: 'SP',
    tier: 'SILVER',
    averageDailyTraffic: 400,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalMetro1,
    name: 'Metrô Sé - Plataforma',
    slug: 'metro-se-plataforma',
    location: 'Plataforma Linha Azul',
    condominiumId: IDS.locationMetro,
    isActive: true,
    isOnline: true,
    orientation: 'horizontal',
    latitude: -23.5505,
    longitude: -46.6333,
    address: 'Praça da Sé, s/n - Plataforma',
    city: 'São Paulo',
    state: 'SP',
    tier: 'SILVER',
    averageDailyTraffic: 80000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // BRONZE
  {
    id: IDS.terminalFarmacia,
    name: 'Farmácia Popular - Balcão',
    slug: 'farmacia-popular-balcao',
    location: 'Balcão',
    condominiumId: IDS.locationFarmacia,
    isActive: true,
    isOnline: true,
    orientation: 'vertical',
    latitude: -23.5486,
    longitude: -46.6550,
    address: 'Rua da Consolação, 800',
    city: 'São Paulo',
    state: 'SP',
    tier: 'BRONZE',
    averageDailyTraffic: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalClinica,
    name: 'Clínica Bem Estar - Recepção',
    slug: 'clinica-bem-estar-recepcao',
    location: 'Recepção',
    condominiumId: IDS.locationClinica,
    isActive: true,
    isOnline: false,
    orientation: 'horizontal',
    latitude: -23.5458,
    longitude: -46.6358,
    address: 'Av. Brasil, 500',
    city: 'São Paulo',
    state: 'SP',
    tier: 'BRONZE',
    averageDailyTraffic: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Hospital (CORPORATE)
  {
    id: IDS.terminalHospital1,
    name: 'Hospital Santa Vida - Recepção',
    slug: 'hospital-santa-vida-recepcao',
    location: 'Recepção Principal',
    condominiumId: IDS.locationHospital,
    isActive: true,
    isOnline: true,
    orientation: 'horizontal',
    latitude: -23.5629,
    longitude: -46.6544,
    address: 'Av. Paulista, 1000 - Recepção',
    city: 'São Paulo',
    state: 'SP',
    tier: 'SILVER',
    averageDailyTraffic: 2000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS.terminalHospital2,
    name: 'Hospital Santa Vida - UTI',
    slug: 'hospital-santa-vida-uti',
    location: 'Corredor UTI',
    condominiumId: IDS.locationHospital,
    isActive: true,
    isOnline: true,
    orientation: 'vertical',
    latitude: -23.5630,
    longitude: -46.6545,
    address: 'Av. Paulista, 1000 - UTI',
    city: 'São Paulo',
    state: 'SP',
    tier: 'BRONZE',
    averageDailyTraffic: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// DADOS FINANCEIROS (Parceiro, Vendedor, Campanhas, PlayLogs)
// ============================================

const IDS_FINANCIAL = {
  // Parceiro de Local (LOCATION_OWNER)
  parceiroPadaria: 'owner-padaria-001',

  // Sales Agent expandido
  salesAgentPaulo: 'agent-paulo-001',

  // Anunciantes
  anuncianteCoca: 'adv-coca-001',
  anuncianteNike: 'adv-nike-001',

  // Campanhas
  campanhaCoca: 'camp-coca-001',
  campanhaNike: 'camp-nike-001',

  // Contratos
  contratoCoca: 'contract-coca-001',
  contratoNike: 'contract-nike-001',
};

// Parceiro de Local (dono da padaria que tem tela instalada)
const locationOwners = [
  {
    id: IDS_FINANCIAL.parceiroPadaria,
    tenantId: IDS.midiaBoxAccount,
    userId: null, // Pode vincular a um user depois
    name: 'José da Silva',
    email: 'jose.padaria@email.com',
    phone: '(11) 99999-0001',
    document: '123.456.789-00',
    // 10% de revenue share sobre campanhas exibidas na tela dele
    commissionRate: 10,
    // Terminais vinculados a este parceiro
    terminalIds: [IDS.terminalPadaria1],
    paymentDetails: {
      pixKey: 'jose.padaria@email.com',
      bankName: 'Nubank',
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Vendedor (Sales Agent) com taxa de comissão
const salesAgents = [
  {
    id: IDS_FINANCIAL.salesAgentPaulo,
    tenantId: IDS.midiaBoxAccount,
    userId: IDS.midiaBoxVendedor,
    name: 'Paulo Silva',
    email: 'vendedor@midiabox.com',
    phone: '(11) 99999-0002',
    document: '987.654.321-00',
    // 15% de comissão sobre contratos fechados
    defaultCommissionRate: 15,
    paymentDetails: {
      pixKey: 'vendedor@midiabox.com',
      bankName: 'Itaú',
    },
    isActive: true,
    totalContracts: 2,
    totalCommissionsPending: 0,
    totalCommissionsPaid: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Anunciantes
const advertisers = [
  {
    id: IDS_FINANCIAL.anuncianteCoca,
    name: 'Coca-Cola Brasil',
    slug: 'coca-cola-brasil',
    contactName: 'Maria Santos',
    contactEmail: 'maria@coca-cola.com.br',
    contactPhone: '(11) 3000-0001',
    cnpj: '12.345.678/0001-90',
    segment: 'alimentacao',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS_FINANCIAL.anuncianteNike,
    name: 'Nike do Brasil',
    slug: 'nike-brasil',
    contactName: 'João Oliveira',
    contactEmail: 'joao@nike.com.br',
    contactPhone: '(11) 3000-0002',
    cnpj: '98.765.432/0001-10',
    segment: 'academia',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Contratos (fechados pelo vendedor)
const contracts = [
  {
    id: IDS_FINANCIAL.contratoCoca,
    tenantId: IDS.midiaBoxAccount,
    advertiserId: IDS_FINANCIAL.anuncianteCoca,
    salesAgentId: IDS_FINANCIAL.salesAgentPaulo,
    name: 'Campanha Natal Coca-Cola',
    partyAName: 'Mídia Box SP',
    partyBName: 'Coca-Cola Brasil',
    // Valor total do contrato
    totalValue: 10000, // R$ 10.000
    // Meta de plays
    totalPlaysTarget: 100000,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    terminalIds: [IDS.terminalShopping1, IDS.terminalShopping2, IDS.terminalPadaria1],
    status: 'active',
    signedAt: '2024-11-25T10:00:00.000Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS_FINANCIAL.contratoNike,
    tenantId: IDS.midiaBoxAccount,
    advertiserId: IDS_FINANCIAL.anuncianteNike,
    salesAgentId: IDS_FINANCIAL.salesAgentPaulo,
    name: 'Campanha Verão Nike',
    partyAName: 'Mídia Box SP',
    partyBName: 'Nike do Brasil',
    totalValue: 5000, // R$ 5.000
    totalPlaysTarget: 50000,
    startDate: '2024-12-15',
    endDate: '2025-01-15',
    terminalIds: [IDS.terminalAcademia, IDS.terminalShopping3],
    status: 'active',
    signedAt: '2024-12-10T14:00:00.000Z',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Campanhas (geradas a partir dos contratos)
const campaigns = [
  {
    id: IDS_FINANCIAL.campanhaCoca,
    tenantId: IDS.midiaBoxAccount,
    contractId: IDS_FINANCIAL.contratoCoca,
    advertiserId: IDS_FINANCIAL.anuncianteCoca,
    name: 'Campanha Natal Coca-Cola',
    budget: 10000,
    totalPlaysTarget: 100000,
    // Valor por play = 10000 / 100000 = R$ 0,10
    valuePerPlay: 0.10,
    startDate: '2024-12-01',
    endDate: '2024-12-31',
    terminalIds: [IDS.terminalShopping1, IDS.terminalShopping2, IDS.terminalPadaria1],
    status: 'ACTIVE',
    playsDelivered: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: IDS_FINANCIAL.campanhaNike,
    tenantId: IDS.midiaBoxAccount,
    contractId: IDS_FINANCIAL.contratoNike,
    advertiserId: IDS_FINANCIAL.anuncianteNike,
    name: 'Campanha Verão Nike',
    budget: 5000,
    totalPlaysTarget: 50000,
    // Valor por play = 5000 / 50000 = R$ 0,10
    valuePerPlay: 0.10,
    startDate: '2024-12-15',
    endDate: '2025-01-15',
    terminalIds: [IDS.terminalAcademia, IDS.terminalShopping3],
    status: 'ACTIVE',
    playsDelivered: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Gera PlayLogs mockados para simular um mês de exibição
 * Isso permite testar o SettlementService
 */
function generateMockPlayLogs(): Array<{
  id: string;
  tenantId: string;
  terminalId: string;
  locationId: string;
  mediaItemId: string;
  campaignId: string;
  advertiserId: string;
  playedAt: string;
  durationSeconds: number;
  slotDurationSeconds: number;
  valuePerPlay: number;
  createdAt: string;
}> {
  const playLogs: Array<{
    id: string;
    tenantId: string;
    terminalId: string;
    locationId: string;
    mediaItemId: string;
    campaignId: string;
    advertiserId: string;
    playedAt: string;
    durationSeconds: number;
    slotDurationSeconds: number;
    valuePerPlay: number;
    createdAt: string;
  }> = [];

  // Simular dezembro de 2024
  const referenceMonth = '2024-12';
  const daysInMonth = 31;

  // Campanha Coca-Cola: 3 terminais, 48 plays/dia por terminal
  const cocaTerminals = [
    { terminalId: IDS.terminalShopping1, locationId: IDS.locationShopping },
    { terminalId: IDS.terminalShopping2, locationId: IDS.locationShopping },
    { terminalId: IDS.terminalPadaria1, locationId: IDS.locationPadaria1 },
  ];

  for (let day = 1; day <= daysInMonth; day++) {
    for (const { terminalId, locationId } of cocaTerminals) {
      // 48 plays por dia = 1 a cada 30 minutos
      for (let play = 0; play < 48; play++) {
        const hour = Math.floor(play / 2);
        const minute = (play % 2) * 30;

        playLogs.push({
          id: `play-coca-${day}-${terminalId}-${play}`,
          tenantId: IDS.midiaBoxAccount,
          terminalId,
          locationId,
          mediaItemId: 'media-coca-001',
          campaignId: IDS_FINANCIAL.campanhaCoca,
          advertiserId: IDS_FINANCIAL.anuncianteCoca,
          playedAt: `${referenceMonth}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`,
          durationSeconds: 15,
          slotDurationSeconds: 15,
          valuePerPlay: 0.10, // R$ 0,10 por play
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Total Coca-Cola: 3 terminais × 48 plays × 31 dias = 4.464 plays
  // Valor total: 4.464 × R$ 0,10 = R$ 446,40

  // Campanha Nike: 2 terminais, 48 plays/dia (apenas últimos 17 dias de dezembro)
  const nikeTerminals = [
    { terminalId: IDS.terminalAcademia, locationId: IDS.locationAcademia },
    { terminalId: IDS.terminalShopping3, locationId: IDS.locationShopping },
  ];

  for (let day = 15; day <= daysInMonth; day++) {
    for (const { terminalId, locationId } of nikeTerminals) {
      for (let play = 0; play < 48; play++) {
        const hour = Math.floor(play / 2);
        const minute = (play % 2) * 30;

        playLogs.push({
          id: `play-nike-${day}-${terminalId}-${play}`,
          tenantId: IDS.midiaBoxAccount,
          terminalId,
          locationId,
          mediaItemId: 'media-nike-001',
          campaignId: IDS_FINANCIAL.campanhaNike,
          advertiserId: IDS_FINANCIAL.anuncianteNike,
          playedAt: `${referenceMonth}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00.000Z`,
          durationSeconds: 15,
          slotDurationSeconds: 15,
          valuePerPlay: 0.10,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // Total Nike: 2 terminais × 48 plays × 17 dias = 1.632 plays
  // Valor total: 1.632 × R$ 0,10 = R$ 163,20

  return playLogs;
}

// Gerar comissões de vendedor (sobre contratos fechados)
const commissionLedger = [
  {
    id: 'comm-coca-001',
    tenantId: IDS.midiaBoxAccount,
    salesAgentId: IDS_FINANCIAL.salesAgentPaulo,
    contractId: IDS_FINANCIAL.contratoCoca,
    invoiceId: null,
    // 15% de R$ 10.000 = R$ 1.500
    amount: 1500,
    rate: 15,
    baseAmount: 10000,
    referenceMonth: '2024-12',
    status: 'PENDING',
    notes: 'Comissão Campanha Natal Coca-Cola',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comm-nike-001',
    tenantId: IDS.midiaBoxAccount,
    salesAgentId: IDS_FINANCIAL.salesAgentPaulo,
    contractId: IDS_FINANCIAL.contratoNike,
    invoiceId: null,
    // 15% de R$ 5.000 = R$ 750
    amount: 750,
    rate: 15,
    baseAmount: 5000,
    referenceMonth: '2024-12',
    status: 'PENDING',
    notes: 'Comissão Campanha Verão Nike',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================
// EXECUÇÃO
// ============================================

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function writeJson(filename: string, data: Array<{ id?: string }>) {
  const filepath = path.join(DATA_DIR, filename);

  // Ler dados existentes
  let existing: Array<{ id?: string }> = [];
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    existing = JSON.parse(content);
  } catch {
    // Arquivo não existe
  }

  // Mesclar dados (evitar duplicatas por ID)
  const existingIds = new Set(existing.map((item) => item.id));
  const newItems = data.filter((item) => !existingIds.has(item.id));

  const merged = [...existing, ...newItems];
  await fs.writeFile(filepath, JSON.stringify(merged, null, 2));

  console.log(`✅ ${filename}: ${newItems.length} novos itens adicionados (total: ${merged.length})`);
}

async function main() {
  console.log('\n🌱 Seed Enterprise - Dados de Teste B2B2C + Financeiro\n');

  await ensureDataDir();

  // Criar usuários (precisa hash async)
  const users = await createUsers();

  // Gerar PlayLogs mockados
  const playLogs = generateMockPlayLogs();

  // Escrever dados base
  await writeJson('accounts.json', accounts);
  await writeJson('users.json', users);
  await writeJson('condominiums.json', condominiums);
  await writeJson('monitors.json', monitors);

  // Escrever dados financeiros
  await writeJson('location-owners.json', locationOwners);
  await writeJson('sales-agents.json', salesAgents);
  await writeJson('advertisers.json', advertisers);
  await writeJson('contracts.json', contracts);
  await writeJson('campaigns.json', campaigns);
  await writeJson('play-logs.json', playLogs);
  await writeJson('commission-ledger.json', commissionLedger);

  console.log('\n✨ Seed concluído!\n');
  console.log('📋 Credenciais de teste:');
  console.log('');
  console.log('  Hospital (Corporate):');
  console.log('    Email: admin@hospital.com');
  console.log('    Senha: 123456');
  console.log('');
  console.log('  Mídia Box (Network Operator):');
  console.log('    Email: admin@midiabox.com');
  console.log('    Senha: 123456');
  console.log('');
  console.log('  Vendedor:');
  console.log('    Email: vendedor@midiabox.com');
  console.log('    Senha: 123456');
  console.log('    Comissão: 15% (R$ 2.250 pendente)');
  console.log('');
  console.log('📊 Dados Financeiros Mockados:');
  console.log('');
  console.log('  Parceiro de Local (José - Padaria Pinheiros):');
  console.log('    Revenue Share: 10%');
  console.log('    Terminais: 1 (Padaria Pinheiros)');
  console.log('');
  console.log('  Campanhas Ativas:');
  console.log('    - Coca-Cola: R$ 10.000 (3 terminais, dez/24)');
  console.log('    - Nike: R$ 5.000 (2 terminais, 15-31 dez/24)');
  console.log('');
  console.log(`  PlayLogs Gerados: ${playLogs.length} registros`);
  console.log('    - Coca-Cola: 4.464 plays (R$ 446,40)');
  console.log('    - Nike: 1.632 plays (R$ 163,20)');
  console.log('');
  console.log('  Para testar Settlement do Parceiro:');
  console.log('    Padaria Pinheiros recebeu plays da Coca-Cola');
  console.log('    Valor gerado: 48 plays × 31 dias × R$ 0,10 = R$ 148,80');
  console.log('    Comissão (10%): R$ 14,88');
  console.log('');
}

main().catch(console.error);
