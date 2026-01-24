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
// EXECUÇÃO
// ============================================

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function writeJson(filename: string, data: unknown[]) {
  const filepath = path.join(DATA_DIR, filename);

  // Ler dados existentes
  let existing: unknown[] = [];
  try {
    const content = await fs.readFile(filepath, 'utf-8');
    existing = JSON.parse(content);
  } catch {
    // Arquivo não existe
  }

  // Mesclar dados (evitar duplicatas por ID)
  const existingIds = new Set(existing.map((item: { id?: string }) => item.id));
  const newItems = data.filter((item: { id?: string }) => !existingIds.has(item.id));

  const merged = [...existing, ...newItems];
  await fs.writeFile(filepath, JSON.stringify(merged, null, 2));

  console.log(`✅ ${filename}: ${newItems.length} novos itens adicionados (total: ${merged.length})`);
}

async function main() {
  console.log('\n🌱 Seed Enterprise - Dados de Teste B2B2C\n');

  await ensureDataDir();

  // Criar usuários (precisa hash async)
  const users = await createUsers();

  // Escrever dados
  await writeJson('accounts.json', accounts);
  await writeJson('users.json', users);
  await writeJson('condominiums.json', condominiums);
  await writeJson('monitors.json', monitors);

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
  console.log('');
}

main().catch(console.error);
