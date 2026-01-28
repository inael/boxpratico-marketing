// Categorias/Segmentos de negócio para anunciantes
export const BUSINESS_CATEGORIES = [
  { id: 'academia', name: 'Academia / Fitness', icon: '💪' },
  { id: 'alimentacao', name: 'Alimentação / Restaurantes', icon: '🍽️' },
  { id: 'automotivo', name: 'Automotivo / Oficinas', icon: '🚗' },
  { id: 'beleza', name: 'Beleza / Estética', icon: '💄' },
  { id: 'clinica', name: 'Clínica / Saúde', icon: '🏥' },
  { id: 'educacao', name: 'Educação / Cursos', icon: '📚' },
  { id: 'entretenimento', name: 'Entretenimento / Lazer', icon: '🎬' },
  { id: 'farmacia', name: 'Farmácia / Drogaria', icon: '💊' },
  { id: 'financeiro', name: 'Financeiro / Bancos', icon: '🏦' },
  { id: 'imobiliario', name: 'Imobiliário', icon: '🏠' },
  { id: 'juridico', name: 'Jurídico / Advocacia', icon: '⚖️' },
  { id: 'loja', name: 'Loja / Varejo', icon: '🛍️' },
  { id: 'mercado', name: 'Mercado / Supermercado', icon: '🛒' },
  { id: 'pet', name: 'Pet Shop / Veterinário', icon: '🐾' },
  { id: 'servicos', name: 'Serviços Gerais', icon: '🔧' },
  { id: 'tecnologia', name: 'Tecnologia / Software', icon: '💻' },
  { id: 'turismo', name: 'Turismo / Viagens', icon: '✈️' },
  { id: 'outros', name: 'Outros', icon: '📦' },
] as const;

export type BusinessCategory = typeof BUSINESS_CATEGORIES[number]['id'];

// Modelo de precificação: por rede (pacote) ou por ponto (individual)
export type PricingModel = 'network' | 'per_point';

// Configuração de precificação por cliente/local
export interface PricingConfig {
  model: PricingModel;
  // Preço por rede (valor único para todas as telas)
  networkPrice?: number;
  // Preço por ponto (valor por tela individual)
  pricePerPoint?: number;
  // População da cidade (para sugerir modelo)
  cityPopulation?: number;
  // Observações sobre precificação
  notes?: string;
}

// Configuração de raio de alcance para anunciante
export interface TargetRadiusConfig {
  // Ponto central (endereço do anunciante ou ponto escolhido)
  centerLat: number;
  centerLng: number;
  // Raio em km
  radiusKm: number;
  // Nome do local central (para exibição)
  centerName?: string;
}

// Função utilitária para calcular distância entre dois pontos (Haversine)
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Anunciante - quem paga para aparecer nas telas
export interface Advertiser {
  id: string;
  name: string;
  slug: string;
  // Dados de contato
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  // Dados da empresa
  cnpj?: string;
  logoUrl?: string;
  // Segmento/categoria do anunciante
  segment?: string;
  // Configuração de raio de alcance (para sugerir locais próximos)
  targetRadius?: TargetRadiusConfig;
  // Observações gerais
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Configuração de comissão do local
export interface CommissionConfig {
  // Percentual de comissão sobre os anunciantes (ex: 30 = 30%)
  percentage: number;
  // Observações sobre o acordo
  notes?: string;
}

export interface Condominium {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  address?: string;
  state?: string;
  city?: string;
  photoUrl?: string;
  whatsappPhone?: string;
  isActive?: boolean;
  showNews?: boolean;
  // Geolocalização
  latitude?: number;
  longitude?: number;
  // Categoria/Segmento do próprio local (para bloquear concorrentes)
  category?: BusinessCategory;
  // Categorias bloqueadas (não exibir anúncios dessas categorias)
  blockedCategories?: BusinessCategory[];
  // Bloquear automaticamente a própria categoria (não exibir concorrentes)
  blockOwnCategory?: boolean;
  // Tráfego médio diário de pessoas no local (para cálculos de alcance)
  averageDailyTraffic?: number;
  // Configuração de precificação (para anunciantes)
  pricing?: PricingConfig;
  // Configuração de comissão (para o local)
  commission?: CommissionConfig;
  // ID da conta vinculada (para multi-tenant)
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'image' | 'video' | 'youtube' | 'pdf' | 'news' | 'rtmp' | 'clock' | 'currency' | 'weather';

// Labels para tipos de mídia
export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  youtube: 'YouTube',
  pdf: 'PDF',
  news: 'Notícias',
  rtmp: 'RTMP/Câmera',
  clock: 'Hora Certa',
  currency: 'Cotação',
  weather: 'Previsão do Tempo',
};

// Ícones para tipos de mídia
export const MEDIA_TYPE_ICONS: Record<MediaType, string> = {
  image: '🖼️',
  video: '🎬',
  youtube: '▶️',
  pdf: '📄',
  news: '📰',
  rtmp: '📹',
  clock: '🕐',
  currency: '💹',
  weather: '🌤️',
};

// Configuração de agendamento de mídia
export interface MediaSchedule {
  enabled: boolean;
  // Data de início e fim (opcional)
  startDate?: string;
  endDate?: string;
  // Horário de exibição (ex: "08:00" a "18:00")
  startTime?: string;
  endTime?: string;
  // Dias da semana (0=Dom, 1=Seg, ..., 6=Sab)
  daysOfWeek?: number[];
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: MediaType;
  sourceUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  playFullVideo?: boolean;
  startTimeSeconds?: number;
  endTimeSeconds?: number;
  isActive: boolean;
  order: number;
  // Anunciante dono desta mídia
  advertiserId: string;
  // Deprecated - usar advertiserId. Local era usado antes da migração.
  condominiumId?: string;
  // Playlist a que esta mídia pertence (opcional)
  campaignId?: string;
  // Agendamento de exibição
  schedule?: MediaSchedule;
  // Gravar estatísticas de exibição
  trackStatistics?: boolean;
  // Grupo de mídia (para exibição em bloco)
  groupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  advertiserId: string; // Playlist pertence a um anunciante
  condominiumId?: string; // Deprecated - usar targetLocations
  monitorId?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  showNews?: boolean;
  newsEveryNMedia?: number;
  newsDurationSeconds?: number;
  // Locais onde a playlist será exibida
  targetLocations?: string[]; // Array de IDs de condominiums/locais
  createdAt: string;
  updatedAt: string;
}

export interface NewsItem {
  title: string;
  link: string;
  description?: string;
  imageUrl?: string;
  source?: string;
  publishedAt?: string;
}

export interface AnalyticsView {
  id: string;
  condominiumId: string;
  condominiumName: string;
  campaignId?: string;
  campaignName?: string;
  ipAddress: string;
  viewDurationSeconds: number;
  viewedAt: string;
}

// Orientação da tela
export type ScreenOrientation = 'horizontal' | 'vertical';

// Classe social para métricas de audiência
export type SocialClass = 'A' | 'B' | 'C' | 'D' | 'E';

// Classificação de qualidade do ponto/terminal (para precificação)
export type TerminalTier = 'GOLD' | 'SILVER' | 'BRONZE';

// Labels e multiplicadores para tiers
export const TERMINAL_TIER_CONFIG: Record<TerminalTier, { label: string; color: string; multiplier: number }> = {
  GOLD: { label: 'Ouro', color: '#FFD700', multiplier: 2.0 },
  SILVER: { label: 'Prata', color: '#C0C0C0', multiplier: 1.5 },
  BRONZE: { label: 'Bronze', color: '#CD7F32', multiplier: 1.0 },
};

// Tipo de gestão de mídia do contrato
export type ContractManagementType = 'SELF_SERVICE' | 'AGENCY_MANAGED';

// Labels para tipos de gestão
export const CONTRACT_MANAGEMENT_LABELS: Record<ContractManagementType, string> = {
  SELF_SERVICE: 'Autoatendimento',    // Cliente gerencia própria mídia
  AGENCY_MANAGED: 'Gerenciado',       // Operador gerencia mídia para o cliente
};

export interface Monitor {
  id: string;
  name: string;
  slug: string;
  location?: string;
  condominiumId: string;
  isActive: boolean;
  lastHeartbeat?: string;
  isOnline?: boolean;
  // ID do dispositivo vinculado (para sistema de ativação)
  deviceId?: string;

  // Orientacao da tela (horizontal = paisagem, vertical = retrato)
  orientation?: ScreenOrientation;

  // Endereco completo do terminal
  address?: string;
  addressNumber?: string;
  complement?: string;
  zipCode?: string;
  neighborhood?: string;
  city?: string;
  state?: string;

  // Horario de funcionamento
  operatingSchedule?: {
    is24h: boolean;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
  };

  // Geolocalização do terminal
  latitude?: number;
  longitude?: number;

  // Classificação do ponto (para precificação)
  tier?: TerminalTier;

  // Metricas de audiencia
  averageDailyTraffic?: number;     // Fluxo de pessoas por dia (ex: 5000)
  averageMonthlyTraffic?: number;   // Fluxo medio de pessoas por mes
  averagePeoplePerHour?: number;    // Media de pessoas simultaneas
  socialClass?: SocialClass;         // Classe social predominante

  // Configuracoes do terminal
  updateCycleMinutes?: number;       // Ciclo de atualizacao (ex: 10 min)
  soundEnabled?: boolean;            // Som ligado/desligado
  timezone?: string;                 // Fuso horario (ex: "America/Sao_Paulo")

  // Barra de rodape (ticker)
  footerEnabled?: boolean;
  footerText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  footerSpeed?: 'slow' | 'normal' | 'fast';

  // Tela de abertura personalizada
  splashLogoUrl?: string;
  splashBgColor?: string;

  createdAt: string;
  updatedAt: string;
}

// Relatório de exposição de mídia
export interface MediaExposureReport {
  mediaId: string;
  mediaTitle: string;
  mediaType: MediaType;
  advertiserId?: string;
  advertiserName?: string;
  // Número de exibições calculadas
  exposuresPerDay: number;
  exposuresPerWeek: number;
  exposuresPerMonth: number;
  exposuresPerYear: number;
  // Tempo total de exposição em segundos
  totalSecondsPerDay: number;
  totalSecondsPerWeek: number;
  totalSecondsPerMonth: number;
  totalSecondsPerYear: number;
  // Dados da playlist
  campaignId?: string;
  campaignName?: string;
  // Dados do local
  condominiumId: string;
  condominiumName: string;
  // Número de monitores onde aparece
  monitorsCount: number;
}

// Configuração global de preço da rede
export interface NetworkPricingConfig {
  // Preço base por display por mês
  pricePerDisplayMonth: number;
  // Número médio de inserções por hora por display
  insertionsPerHour: number;
  // Duração média de cada inserção em segundos
  avgInsertionDurationSeconds: number;
  // Horário de funcionamento padrão (horas por dia)
  operatingHoursPerDay: number;
  // Moeda (BRL)
  currency: string;
  // Última atualização
  updatedAt: string;
}

// ============================================
// RBAC - ROLES E PERMISSÕES (NOVO SISTEMA MULTI-TENANT)
// ============================================

// Roles do sistema (novos)
export type Role =
  | 'SUPER_ADMIN'      // Dono da plataforma - acesso total
  | 'TENANT_ADMIN'     // Administrador do tenant
  | 'TENANT_MANAGER'   // Gerente do tenant (admin limitado)
  | 'SALES_AGENT'      // Vendedor externo (prospecção + contratos)
  | 'LOCATION_OWNER'   // Parceiro de local (acesso limitado)
  | 'ADVERTISER'       // Anunciante (campanhas apenas)
  | 'OPERATOR';        // Operador de conteúdo

// Labels para roles
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Administrador',
  TENANT_MANAGER: 'Gerente',
  SALES_AGENT: 'Vendedor',
  LOCATION_OWNER: 'Parceiro de Local',
  ADVERTISER: 'Anunciante',
  OPERATOR: 'Operador',
};

// Tipo de tenant - define modelo de negócio
export type TenantType = 'NETWORK_OPERATOR' | 'CORPORATE_CLIENT';

// Labels para tipos de tenant
export const TENANT_TYPE_LABELS: Record<TenantType, string> = {
  NETWORK_OPERATOR: 'Operador de Rede',     // Vende publicidade, usa Campanhas
  CORPORATE_CLIENT: 'Cliente Corporativo',  // TV interna, usa Playlists diretas
};

// Descrições detalhadas dos tipos de tenant
export const TENANT_TYPE_DESCRIPTIONS: Record<TenantType, string> = {
  NETWORK_OPERATOR: 'Opera rede de telas e vende espaço publicitário para anunciantes. Usa campanhas com regras automáticas de injeção de mídia.',
  CORPORATE_CLIENT: 'Usa telas para comunicação interna (TV corporativa). Não tem anunciantes externos, usa playlists manuais diretas.',
};

// Status do tenant
export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

// Planos de assinatura
export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM';

// Estratégia quando playlist excede duração alvo
export type LoopViolationStrategy = 'WARNING' | 'BLOCK';

// Configurações de playlist do tenant (declaração antecipada)
export interface PlaylistValidationConfig {
  targetLoopDuration: number;
  loopViolationStrategy: LoopViolationStrategy;
  defaultSlotDuration: number;
  minSlotDuration: number;
  maxSlotDuration: number;
}

// Valores padrão de validação de playlist
export const DEFAULT_PLAYLIST_CONFIG: PlaylistValidationConfig = {
  targetLoopDuration: 1200,  // 20 minutos
  loopViolationStrategy: 'WARNING',
  defaultSlotDuration: 15,   // 15 segundos
  minSlotDuration: 5,        // Mínimo 5 segundos
  maxSlotDuration: 60,       // Máximo 60 segundos
};

// Tenant (Cliente SaaS)
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  type: TenantType;
  status: TenantStatus;
  plan: SubscriptionPlan;

  // Contato
  email: string;
  phone?: string;
  document?: string; // CNPJ/CPF

  // Endereço
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;

  // Assinatura
  trialEndsAt?: string;
  subscriptionStartedAt?: string;
  monthlyFee: number;

  // White-label
  customDomain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;

  // Feature toggles
  featuresEnabled?: Record<string, boolean>;

  // Configurações de validação de playlist
  targetLoopDuration?: number;       // Duração alvo do ciclo em segundos (default: 1200 = 20min)
  loopViolationStrategy?: LoopViolationStrategy; // WARNING ou BLOCK
  defaultSlotDuration?: number;      // Duração padrão de slot (default: 15s)
  minSlotDuration?: number;          // Duração mínima de slot (default: 5s)
  maxSlotDuration?: number;          // Duração máxima de slot (default: 60s)

  // Afiliado
  referrerId?: string;
  referralCode?: string;

  createdAt: string;
  updatedAt: string;
}

// Função helper para obter configuração de playlist do tenant
export function getTenantPlaylistConfig(tenant: Tenant | null): PlaylistValidationConfig {
  if (!tenant) {
    return DEFAULT_PLAYLIST_CONFIG;
  }

  return {
    targetLoopDuration: tenant.targetLoopDuration ?? DEFAULT_PLAYLIST_CONFIG.targetLoopDuration,
    loopViolationStrategy: tenant.loopViolationStrategy ?? DEFAULT_PLAYLIST_CONFIG.loopViolationStrategy,
    defaultSlotDuration: tenant.defaultSlotDuration ?? DEFAULT_PLAYLIST_CONFIG.defaultSlotDuration,
    minSlotDuration: tenant.minSlotDuration ?? DEFAULT_PLAYLIST_CONFIG.minSlotDuration,
    maxSlotDuration: tenant.maxSlotDuration ?? DEFAULT_PLAYLIST_CONFIG.maxSlotDuration,
  };
}

// Tipo de usuario (legado - mantido para compatibilidade)
export type UserRole = 'admin' | 'operator' | 'viewer';

// Provedor de autenticação
export type AuthProvider = 'credentials' | 'google';

// Usuario do sistema (atualizado para multi-tenant)
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;
  phone?: string;

  // Autenticação OAuth
  provider?: AuthProvider;
  providerId?: string; // ID do usuário no Google/etc
  emailVerified?: boolean;

  // Multi-tenant
  tenantId?: string;
  tenant?: Tenant;

  // Role (suporta novo RBAC e legado)
  role: Role | UserRole;

  // Para LOCATION_OWNER - quais locations gerencia
  ownedLocationIds?: string[];

  // Para ADVERTISER - qual conta de anunciante
  advertiserAccountId?: string;

  // Sistema de afiliados
  referralCode?: string;
  referrerId?: string;
  affiliateDepth?: number; // 0 = plataforma, 1 = direto, 2 = indireto

  // Conta vinculada (legado - usar tenantId)
  accountId?: string;

  // Permissoes (legado)
  isAdmin: boolean;
  // Terminais que pode acessar (vazio = todos)
  allowedTerminals?: string[];
  // Anunciantes que pode acessar (vazio = todos)
  allowedAdvertisers?: string[];
  // Restringir conteudo (so ve o que ele criou)
  restrictContent?: boolean;

  // Preferencias
  timezone?: string;
  showAvatarInMenu?: boolean;

  // Notificacoes
  emailNotifications?: boolean;
  emailFrequency?: 'daily' | 'weekly' | 'monthly';
  whatsappNotifications?: boolean;
  whatsappNumber?: string;

  // Status
  isActive: boolean;
  lastLoginAt?: string;
  termsAcceptedAt?: string;

  createdAt: string;
  updatedAt: string;
}

// Permissões granulares por recurso
export type Permission =
  // Plataforma (só SUPER_ADMIN)
  | 'platform:manage'
  | 'tenants:read'
  | 'tenants:create'
  | 'tenants:update'
  | 'tenants:delete'
  // Locais/Locations
  | 'locations:read'
  | 'locations:create'
  | 'locations:update'
  | 'locations:delete'
  // Monitores/Screens
  | 'screens:read'
  | 'screens:create'
  | 'screens:update'
  | 'screens:delete'
  // Anunciantes
  | 'advertisers:read'
  | 'advertisers:create'
  | 'advertisers:update'
  | 'advertisers:delete'
  // Mídias
  | 'media:read'
  | 'media:create'
  | 'media:update'
  | 'media:delete'
  // Playlists
  | 'playlists:read'
  | 'playlists:create'
  | 'playlists:update'
  | 'playlists:delete'
  // Campanhas
  | 'campaigns:read'
  | 'campaigns:create'
  | 'campaigns:update'
  | 'campaigns:delete'
  // Contratos
  | 'contracts:read'
  | 'contracts:create'
  | 'contracts:update'
  | 'contracts:delete'
  // Usuários
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Financeiro
  | 'financial:read'
  | 'financial:manage'
  // Afiliados
  | 'affiliates:read'
  | 'affiliates:manage'
  // Configurações
  | 'settings:read'
  | 'settings:update'
  // Relatórios
  | 'reports:read'
  | 'analytics:read'
  // Comunicação interna (Corporativo)
  | 'internal_comms:read'
  | 'internal_comms:create'
  | 'internal_comms:update'
  | 'internal_comms:delete'
  // Legados (para compatibilidade)
  | 'condominiums:read'
  | 'condominiums:create'
  | 'condominiums:update'
  | 'condominiums:delete'
  | 'monitors:read'
  | 'monitors:create'
  | 'monitors:update'
  | 'monitors:delete'
  | 'accounts:read'
  | 'accounts:create'
  | 'accounts:update'
  | 'accounts:delete';

// Permissões por Role (novo sistema RBAC)
export const NEW_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // Acesso total
    'platform:manage',
    'tenants:read', 'tenants:create', 'tenants:update', 'tenants:delete',
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'screens:read', 'screens:create', 'screens:update', 'screens:delete',
    'advertisers:read', 'advertisers:create', 'advertisers:update', 'advertisers:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'playlists:read', 'playlists:create', 'playlists:update', 'playlists:delete',
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete',
    'contracts:read', 'contracts:create', 'contracts:update', 'contracts:delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'financial:read', 'financial:manage',
    'affiliates:read', 'affiliates:manage',
    'settings:read', 'settings:update',
    'reports:read', 'analytics:read',
    'internal_comms:read', 'internal_comms:create', 'internal_comms:update', 'internal_comms:delete',
    // Legados
    'condominiums:read', 'condominiums:create', 'condominiums:update', 'condominiums:delete',
    'monitors:read', 'monitors:create', 'monitors:update', 'monitors:delete',
    'accounts:read', 'accounts:create', 'accounts:update', 'accounts:delete',
  ],
  TENANT_ADMIN: [
    // Admin do tenant - tudo exceto plataforma
    'locations:read', 'locations:create', 'locations:update', 'locations:delete',
    'screens:read', 'screens:create', 'screens:update', 'screens:delete',
    'advertisers:read', 'advertisers:create', 'advertisers:update', 'advertisers:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'playlists:read', 'playlists:create', 'playlists:update', 'playlists:delete',
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete',
    'contracts:read', 'contracts:create', 'contracts:update', 'contracts:delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'financial:read', 'financial:manage',
    'affiliates:read', 'affiliates:manage',
    'settings:read', 'settings:update',
    'reports:read', 'analytics:read',
    'internal_comms:read', 'internal_comms:create', 'internal_comms:update', 'internal_comms:delete',
    // Legados
    'condominiums:read', 'condominiums:create', 'condominiums:update', 'condominiums:delete',
    'monitors:read', 'monitors:create', 'monitors:update', 'monitors:delete',
  ],
  TENANT_MANAGER: [
    // Gerente - sem deletar, sem financeiro avançado
    'locations:read', 'locations:create', 'locations:update',
    'screens:read', 'screens:create', 'screens:update',
    'advertisers:read', 'advertisers:create', 'advertisers:update',
    'media:read', 'media:create', 'media:update',
    'playlists:read', 'playlists:create', 'playlists:update',
    'campaigns:read', 'campaigns:create', 'campaigns:update',
    'contracts:read', 'contracts:create', 'contracts:update',
    'users:read',
    'financial:read',
    'affiliates:read',
    'reports:read', 'analytics:read',
    'internal_comms:read', 'internal_comms:create', 'internal_comms:update',
    // Legados
    'condominiums:read', 'condominiums:create', 'condominiums:update',
    'monitors:read', 'monitors:create', 'monitors:update',
  ],
  LOCATION_OWNER: [
    // Parceiro de local - só suas telas e enviar avisos
    'locations:read',
    'screens:read',
    'media:read', 'media:create',
    'playlists:read',
    'reports:read',
    'internal_comms:read', 'internal_comms:create',
    // Legados
    'condominiums:read',
    'monitors:read',
  ],
  ADVERTISER: [
    // Anunciante - só suas campanhas
    'campaigns:read',
    'media:read',
    'reports:read', 'analytics:read',
  ],
  OPERATOR: [
    // Operador - conteúdo sem gestão financeira
    'locations:read',
    'screens:read', 'screens:update',
    'media:read', 'media:create', 'media:update',
    'playlists:read', 'playlists:create', 'playlists:update',
    'campaigns:read',
    'reports:read',
    'internal_comms:read', 'internal_comms:create', 'internal_comms:update',
    // Legados
    'condominiums:read',
    'monitors:read', 'monitors:update',
  ],
  SALES_AGENT: [
    // Vendedor externo - prospecção e contratos
    'locations:read',
    'screens:read',
    'advertisers:read', 'advertisers:create', 'advertisers:update',
    'campaigns:read', 'campaigns:create',
    'contracts:read', 'contracts:create', 'contracts:update',
    'financial:read',
    'reports:read',
    // Legados
    'condominiums:read',
    'monitors:read',
  ],
};

// Permissões por role (legado - mantido para compatibilidade)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: NEW_ROLE_PERMISSIONS.TENANT_ADMIN,
  operator: NEW_ROLE_PERMISSIONS.OPERATOR,
  viewer: NEW_ROLE_PERMISSIONS.LOCATION_OWNER,
};

// Verificar se usuário tem permissão (suporta Role novo e UserRole legado)
export function hasPermission(user: User, permission: Permission): boolean {
  // Super admin tem acesso total
  if (user.role === 'SUPER_ADMIN' || user.isAdmin) return true;

  // Novo sistema RBAC
  if (user.role in NEW_ROLE_PERMISSIONS) {
    const rolePermissions = NEW_ROLE_PERMISSIONS[user.role as Role] || [];
    return rolePermissions.includes(permission);
  }

  // Legado
  const legacyRole = user.role as unknown as UserRole;
  const rolePermissions = ROLE_PERMISSIONS[legacyRole] || [];
  return rolePermissions.includes(permission);
}

// Verificar múltiplas permissões (todas devem ser verdadeiras)
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(user, p));
}

// Verificar pelo menos uma permissão
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(user, p));
}

// Labels para roles (legado)
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  operator: 'Operador',
  viewer: 'Visualizador',
};

// Tipos de contrato
export type ContractType = 'partnership' | 'advertising' | 'space_cession';

// Status do contrato
export type ContractStatus = 'draft' | 'pending_signature' | 'signed' | 'active' | 'expired' | 'cancelled';

// Contrato
export interface Contract {
  id: string;
  type: ContractType;

  // Partes
  partyAName: string;      // Operador/Parceiro (quem oferece o serviço)
  partyACnpj?: string;
  partyBName: string;      // Cliente/Local (quem contrata)
  partyBDocument?: string; // CPF ou CNPJ
  partyBEmail?: string;
  partyBPhone?: string;

  // Valores
  monthlyValue?: number;
  totalValue?: number;
  paymentDay?: number;     // Dia do vencimento (1-31)

  // Datas
  startDate: string;
  endDate: string;
  signedAt?: string;

  // Arquivos
  draftPdfUrl?: string;    // PDF gerado pelo sistema (rascunho)
  signedPdfUrl?: string;   // PDF assinado (upload manual)

  // Status
  status: ContractStatus;

  // Relacionamentos (novo modelo unificado)
  companyId?: string;      // ID da empresa (Company) - ponto de mídia ou anunciante

  // Deprecated - mantidos para compatibilidade com dados antigos
  condominiumId?: string;  // Use companyId
  advertiserId?: string;   // Use companyId

  // Observações
  notes?: string;

  // Metadados
  createdAt: string;
  updatedAt: string;

  // Futura integração AssinaAgora
  assinaAgoraDocId?: string;
  assinaAgoraStatus?: string;
}

// Labels para tipos de contrato
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  partnership: 'Parceria',
  advertising: 'Publicidade',
  space_cession: 'Cessão de Espaço',
};

// Labels para status de contrato
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Rascunho',
  pending_signature: 'Aguardando Assinatura',
  signed: 'Assinado',
  active: 'Ativo',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

// Cores para status de contrato
export const CONTRACT_STATUS_COLORS: Record<ContractStatus, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  pending_signature: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  signed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  expired: { bg: 'bg-red-100', text: 'text-red-700' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

// Grupo de Mídias - organizar mídias em grupos reutilizáveis
export interface MediaGroup {
  id: string;
  name: string;
  slug: string;
  description?: string;
  // Cor para identificação visual
  color?: string;
  // Ícone (emoji ou nome de ícone)
  icon?: string;
  // Tags para organização e busca
  tags?: string[];
  // Anunciante dono do grupo (opcional - null = grupo do sistema/admin)
  advertiserId?: string;
  // Mídias que pertencem a este grupo (array de IDs)
  mediaIds: string[];
  // Ordenação das mídias dentro do grupo
  mediaOrder?: Record<string, number>;
  // Configurações de exibição do grupo
  displayMode?: 'sequential' | 'random' | 'weighted';
  // Agendamento do grupo (aplicado a todas as mídias)
  schedule?: MediaSchedule;
  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cores predefinidas para grupos
export const MEDIA_GROUP_COLORS = [
  { id: 'blue', name: 'Azul', hex: '#3B82F6' },
  { id: 'green', name: 'Verde', hex: '#22C55E' },
  { id: 'yellow', name: 'Amarelo', hex: '#EAB308' },
  { id: 'orange', name: 'Laranja', hex: '#F97316' },
  { id: 'red', name: 'Vermelho', hex: '#EF4444' },
  { id: 'purple', name: 'Roxo', hex: '#A855F7' },
  { id: 'pink', name: 'Rosa', hex: '#EC4899' },
  { id: 'cyan', name: 'Ciano', hex: '#06B6D4' },
  { id: 'gray', name: 'Cinza', hex: '#6B7280' },
] as const;

// Labels para modo de exibição do grupo
export const MEDIA_GROUP_DISPLAY_LABELS: Record<string, string> = {
  sequential: 'Sequencial',
  random: 'Aleatório',
  weighted: 'Por Peso',
};

// Tipo de arquivo da biblioteca
export type LibraryFileType = 'image' | 'video' | 'audio' | 'document' | 'other';

// Item da biblioteca de conteúdos
export interface LibraryItem {
  id: string;
  name: string;
  // Arquivo
  fileUrl: string;
  fileType: LibraryFileType;
  mimeType?: string;
  fileSize?: number;
  // Dimensões (para imagens/vídeos)
  width?: number;
  height?: number;
  duration?: number; // em segundos, para vídeos/áudios
  // Thumbnail
  thumbnailUrl?: string;
  // Organização
  folder?: string;
  tags?: string[];
  description?: string;
  // Anunciante dono (null = biblioteca do sistema)
  advertiserId?: string;
  // Estatísticas de uso
  usageCount?: number;
  lastUsedAt?: string;
  // Metadados
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pasta da biblioteca
export interface LibraryFolder {
  id: string;
  name: string;
  slug: string;
  parentId?: string; // Para subpastas
  color?: string;
  icon?: string;
  advertiserId?: string;
  createdAt: string;
  updatedAt: string;
}

// Labels para tipos de arquivo
export const LIBRARY_FILE_TYPE_LABELS: Record<LibraryFileType, string> = {
  image: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  document: 'Documento',
  other: 'Outro',
};

// Ícones para tipos de arquivo
export const LIBRARY_FILE_TYPE_ICONS: Record<LibraryFileType, string> = {
  image: 'PhotoIcon',
  video: 'VideoCameraIcon',
  audio: 'MusicalNoteIcon',
  document: 'DocumentIcon',
  other: 'PaperClipIcon',
};

// Tipo de comando remoto
export type RemoteCommandType =
  | 'refresh'          // Atualizar conteudo
  | 'restart'          // Reiniciar player
  | 'screenshot'       // Capturar tela
  | 'volume'           // Ajustar volume
  | 'clear_cache'      // Limpar cache
  | 'message'          // Exibir mensagem na tela
  | 'update_settings'  // Atualizar configuracoes
  | 'reboot';          // Reiniciar dispositivo

// Status do comando
export type CommandStatus = 'pending' | 'sent' | 'received' | 'executed' | 'failed';

// Comando remoto
export interface RemoteCommand {
  id: string;
  monitorId: string;
  type: RemoteCommandType;
  payload?: Record<string, unknown>;
  status: CommandStatus;
  createdAt: string;
  sentAt?: string;
  executedAt?: string;
  errorMessage?: string;
  createdBy?: string;
}

// Labels para tipos de comando
export const COMMAND_TYPE_LABELS: Record<RemoteCommandType, string> = {
  refresh: 'Atualizar Conteudo',
  restart: 'Reiniciar Player',
  screenshot: 'Capturar Tela',
  volume: 'Ajustar Volume',
  clear_cache: 'Limpar Cache',
  message: 'Exibir Mensagem',
  update_settings: 'Atualizar Configuracoes',
  reboot: 'Reiniciar Dispositivo',
};

// Icones para tipos de comando
export const COMMAND_TYPE_ICONS: Record<RemoteCommandType, string> = {
  refresh: '🔄',
  restart: '🔁',
  screenshot: '📸',
  volume: '🔊',
  clear_cache: '🗑️',
  message: '💬',
  update_settings: '⚙️',
  reboot: '🔌',
};

// ============================================
// ACCOUNTS (Contas/Tenants)
// ============================================

export type AccountPlan = 'trial' | 'basic' | 'pro' | 'enterprise';
export type AccountStatus = 'active' | 'trial' | 'expired' | 'suspended' | 'cancelled';

export interface Account {
  id: string;
  name: string;              // Nome da empresa/condomínio
  slug: string;

  // Tipo de negócio
  type?: TenantType;         // NETWORK_OPERATOR ou CORPORATE_CLIENT

  // Dados do proprietário
  ownerName: string;
  email: string;
  phone?: string;

  // Plano e limites
  plan: AccountPlan;
  maxMonitors: number;       // Trial: 1, Basic: 3, Pro: 10, Enterprise: ilimitado
  maxStorageMB: number;      // Em MB

  // Trial
  trialDays?: number;        // 1-30 dias
  trialStartedAt?: string;
  trialExpiresAt?: string;

  // Status
  status: AccountStatus;

  // Metadados
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Limites por plano
export const ACCOUNT_PLAN_LIMITS: Record<AccountPlan, { monitors: number; storageMB: number; label: string }> = {
  trial: { monitors: 1, storageMB: 100, label: 'Teste Grátis' },
  basic: { monitors: 3, storageMB: 500, label: 'Básico' },
  pro: { monitors: 10, storageMB: 2000, label: 'Profissional' },
  enterprise: { monitors: 999, storageMB: 10000, label: 'Empresarial' },
};

// Labels de status
export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: 'Ativo',
  trial: 'Período de Teste',
  expired: 'Expirado',
  suspended: 'Suspenso',
  cancelled: 'Cancelado',
};

// ============================================
// PRICING CONFIG (Configuração de Preços)
// ============================================

// Faixa de desconto por volume de telas
export interface VolumeDiscount {
  minScreens: number;    // Quantidade mínima de telas
  maxScreens: number;    // Quantidade máxima (999 = ilimitado)
  pricePerScreen: number; // Preço por tela nessa faixa
  discountPercent: number; // % de desconto em relação ao preço base
}

// Configuração global de preços do sistema
export interface SystemPricingConfig {
  // ======== OPERADORES (Whitelabel) ========
  // Preço base por monitor/mês para operadores
  operatorPricePerMonitor: number; // R$35 default

  // Comissão da plataforma sobre receita dos operadores (%)
  platformCommissionPercent: number; // 20% default

  // ======== ANUNCIANTES ========
  // Preço base por tela/mês para anunciantes
  advertiserBasePricePerScreen: number; // R$35 default

  // Faixas de desconto por volume
  volumeDiscounts: VolumeDiscount[];

  // Multiplicadores por características do local
  premiumMultipliers: {
    // Tráfego alto (>1000 pessoas/dia)
    highTraffic: number; // 1.5x default
    // Classe A/B
    premiumLocation: number; // 1.3x default
    // Horário nobre (18h-22h)
    primeTime: number; // 1.2x default
  };

  // ======== TRIAL ========
  trialDaysDefault: number; // 7 dias default
  trialDaysMax: number; // 30 dias max

  // ======== PAGAMENTO ========
  // Taxa do gateway (MercadoPago ~5%)
  paymentGatewayFeePercent: number;

  // Métodos habilitados
  paymentMethods: {
    pix: boolean;
    creditCard: boolean;
    boleto: boolean;
  };

  // Última atualização
  updatedAt: string;
}

// Valores padrão de configuração de preços
export const DEFAULT_PRICING_CONFIG: SystemPricingConfig = {
  // Operadores
  operatorPricePerMonitor: 35,
  platformCommissionPercent: 20,

  // Anunciantes
  advertiserBasePricePerScreen: 35,
  volumeDiscounts: [
    { minScreens: 1, maxScreens: 5, pricePerScreen: 35, discountPercent: 0 },
    { minScreens: 6, maxScreens: 10, pricePerScreen: 30, discountPercent: 14 },
    { minScreens: 11, maxScreens: 20, pricePerScreen: 25, discountPercent: 29 },
    { minScreens: 21, maxScreens: 999, pricePerScreen: 20, discountPercent: 43 },
  ],
  premiumMultipliers: {
    highTraffic: 1.5,
    premiumLocation: 1.3,
    primeTime: 1.2,
  },

  // Trial
  trialDaysDefault: 7,
  trialDaysMax: 30,

  // Pagamento
  paymentGatewayFeePercent: 5,
  paymentMethods: {
    pix: true,
    creditCard: true,
    boleto: true,
  },

  updatedAt: new Date().toISOString(),
};

// Calcular preço por tela baseado no volume
export function calculatePricePerScreen(
  screenCount: number,
  config: SystemPricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const discount = config.volumeDiscounts.find(
    d => screenCount >= d.minScreens && screenCount <= d.maxScreens
  );
  return discount?.pricePerScreen || config.advertiserBasePricePerScreen;
}

// Calcular preço total para anunciante
export function calculateAdvertiserPrice(
  screenCount: number,
  options: {
    isHighTraffic?: boolean;
    isPremiumLocation?: boolean;
    isPrimeTime?: boolean;
  } = {},
  config: SystemPricingConfig = DEFAULT_PRICING_CONFIG
): { pricePerScreen: number; totalPrice: number; discount: number } {
  let pricePerScreen = calculatePricePerScreen(screenCount, config);

  // Aplicar multiplicadores premium
  if (options.isHighTraffic) {
    pricePerScreen *= config.premiumMultipliers.highTraffic;
  }
  if (options.isPremiumLocation) {
    pricePerScreen *= config.premiumMultipliers.premiumLocation;
  }
  if (options.isPrimeTime) {
    pricePerScreen *= config.premiumMultipliers.primeTime;
  }

  const totalPrice = Math.round(pricePerScreen * screenCount * 100) / 100;
  const baseTotal = config.advertiserBasePricePerScreen * screenCount;
  const discount = Math.round((1 - totalPrice / baseTotal) * 100);

  return {
    pricePerScreen: Math.round(pricePerScreen * 100) / 100,
    totalPrice,
    discount: Math.max(0, discount),
  };
}

// Calcular comissão da plataforma sobre operador
export function calculatePlatformCommission(
  operatorRevenue: number,
  config: SystemPricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return Math.round(operatorRevenue * (config.platformCommissionPercent / 100) * 100) / 100;
}

// ============================================
// ACTIVATION CODES (Códigos de Ativação)
// ============================================

export type ActivationStatus = 'pending' | 'activated' | 'expired';

export interface ActivationCode {
  id: string;
  code: string;              // "ABC-1234" (formato amigável)
  deviceId: string;          // Identificador único do dispositivo

  // Expiração do código (15 minutos)
  createdAt: string;
  expiresAt: string;

  // Status
  status: ActivationStatus;

  // Após ativação
  activatedAt?: string;
  accountId?: string;
  monitorId?: string;
}

// Gerar código amigável (ABC-1234)
export function generateActivationCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sem I e O para evitar confusão
  const numbers = '0123456789';

  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += numbers[Math.floor(Math.random() * numbers.length)];
  }

  return code;
}

// Relatório consolidado por anunciante
export interface AdvertiserExposureReport {
  advertiserId: string;
  advertiserName: string;
  advertiserSegment?: string;
  // Total de mídias do anunciante
  totalMediaItems: number;
  // Soma de exposições de todas as mídias
  totalExposuresPerDay: number;
  totalExposuresPerWeek: number;
  totalExposuresPerMonth: number;
  totalExposuresPerYear: number;
  // Tempo total de todas as mídias
  totalSecondsPerDay: number;
  totalSecondsPerWeek: number;
  totalSecondsPerMonth: number;
  totalSecondsPerYear: number;
  // Número de locais onde aparece
  locationsCount: number;
  // Número de monitores onde aparece
  monitorsCount: number;
}

// ============================================
// SISTEMA DE MEDALHAS (Classificação de Pontos)
// ============================================

// Tipos de medalha baseado no fluxo de pessoas
export type MedalType = 'bronze' | 'silver' | 'gold';

// Configuração de uma faixa de medalha
export interface MedalTier {
  type: MedalType;
  label: string;
  minTraffic: number;      // Fluxo mínimo de pessoas/dia
  maxTraffic: number;      // Fluxo máximo (999999 = infinito)
  priceMultiplier: number; // Multiplicador de preço (ex: 1.0, 1.5, 2.0)
  color: string;           // Cor hex para exibição
  icon: string;            // Emoji ou ícone
}

// Configuração global de medalhas
export interface MedalConfig {
  enabled: boolean;
  tiers: MedalTier[];
  updatedAt: string;
}

// Labels para medalhas
export const MEDAL_LABELS: Record<MedalType, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
};

// Cores padrão para medalhas
export const MEDAL_COLORS: Record<MedalType, { bg: string; text: string; border: string }> = {
  bronze: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  silver: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
};

// Ícones/emojis para medalhas
export const MEDAL_ICONS: Record<MedalType, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
};

// Configuração padrão de medalhas
export const DEFAULT_MEDAL_CONFIG: MedalConfig = {
  enabled: true,
  tiers: [
    {
      type: 'bronze',
      label: 'Bronze',
      minTraffic: 1,
      maxTraffic: 199,
      priceMultiplier: 1.0,
      color: '#CD7F32',
      icon: '🥉',
    },
    {
      type: 'silver',
      label: 'Prata',
      minTraffic: 200,
      maxTraffic: 299,
      priceMultiplier: 1.5,
      color: '#C0C0C0',
      icon: '🥈',
    },
    {
      type: 'gold',
      label: 'Ouro',
      minTraffic: 300,
      maxTraffic: 999999,
      priceMultiplier: 2.0,
      color: '#FFD700',
      icon: '🥇',
    },
  ],
  updatedAt: new Date().toISOString(),
};

// Função para determinar a medalha de um ponto baseado no fluxo
export function getMedalForTraffic(
  dailyTraffic: number,
  config: MedalConfig = DEFAULT_MEDAL_CONFIG
): MedalTier | null {
  if (!config.enabled || !dailyTraffic || dailyTraffic <= 0) {
    return null;
  }

  return config.tiers.find(
    tier => dailyTraffic >= tier.minTraffic && dailyTraffic <= tier.maxTraffic
  ) || null;
}

// Função para calcular preço com multiplicador de medalha
export function applyMedalMultiplier(
  basePrice: number,
  dailyTraffic: number,
  config: MedalConfig = DEFAULT_MEDAL_CONFIG
): { price: number; medal: MedalTier | null } {
  const medal = getMedalForTraffic(dailyTraffic, config);
  const multiplier = medal?.priceMultiplier || 1.0;
  return {
    price: Math.round(basePrice * multiplier * 100) / 100,
    medal,
  };
}

// ============================================
// EMPRESA (Company) - Unificação de Locais e Anunciantes
// ============================================

// Tipo de pessoa (física ou jurídica)
export type PersonType = 'individual' | 'company';

// Papéis que uma empresa pode ter
export interface CompanyRoles {
  // É um ponto com telas (antigo Condominium/Local)
  isScreenLocation: boolean;
  // É um anunciante (compra publicidade)
  isAdvertiser: boolean;
}

// Empresa unificada (substitui Condominium + Advertiser)
export interface Company {
  id: string;
  name: string;
  slug: string;

  // Tipo de pessoa
  personType: PersonType;

  // Documento (CPF ou CNPJ)
  document?: string;

  // Papéis
  roles: CompanyRoles;

  // Dados de contato
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // Logo/Foto
  logoUrl?: string;

  // ====== ENDEREÇO ======
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Geolocalização (preenchida automaticamente via geocoding)
  latitude?: number;
  longitude?: number;
  geocodedAt?: string; // Data do último geocoding
  geocodeSource?: 'google' | 'manual'; // Fonte das coordenadas

  // ====== CAMPOS PARA PONTO DE TELA (isScreenLocation) ======
  // Categoria/Segmento do local (para bloquear concorrentes)
  category?: BusinessCategory;
  // Categorias bloqueadas (não exibir anúncios dessas categorias)
  blockedCategories?: BusinessCategory[];
  // Bloquear automaticamente a própria categoria
  blockOwnCategory?: boolean;
  // Tráfego médio diário de pessoas
  averageDailyTraffic?: number;
  // Configuração de precificação (para anunciantes que exibem aqui)
  pricing?: PricingConfig;
  // Configuração de comissão do local
  commission?: CommissionConfig;
  // WhatsApp do local
  whatsappPhone?: string;
  // Exibir notícias
  showNews?: boolean;

  // ====== CAMPOS PARA ANUNCIANTE (isAdvertiser) ======
  // Segmento de atuação
  segment?: string;
  // Configuração de raio de alcance (para sugerir locais próximos)
  targetRadius?: TargetRadiusConfig;
  // Observações gerais
  notes?: string;

  // ====== METADADOS ======
  isActive: boolean;
  // ID da conta vinculada (para multi-tenant)
  accountId?: string;
  createdAt: string;
  updatedAt: string;
}

// Labels para tipo de pessoa
export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  individual: 'Pessoa Física',
  company: 'Pessoa Jurídica',
};

// Função helper para verificar se empresa é ponto de tela
export function isScreenLocation(company: Company): boolean {
  return company.roles?.isScreenLocation === true;
}

// Função helper para verificar se empresa é anunciante
export function isAdvertiser(company: Company): boolean {
  return company.roles?.isAdvertiser === true;
}

// Converter Company para Condominium (compatibilidade)
export function companyToCondominium(company: Company): Condominium | null {
  if (!isScreenLocation(company)) return null;

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    cnpj: company.document,
    address: company.address,
    state: company.state,
    city: company.city,
    photoUrl: company.logoUrl,
    whatsappPhone: company.whatsappPhone,
    isActive: company.isActive,
    showNews: company.showNews,
    latitude: company.latitude,
    longitude: company.longitude,
    category: company.category,
    blockedCategories: company.blockedCategories,
    blockOwnCategory: company.blockOwnCategory,
    averageDailyTraffic: company.averageDailyTraffic,
    pricing: company.pricing,
    commission: company.commission,
    accountId: company.accountId,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

// Converter Company para Advertiser (compatibilidade)
export function companyToAdvertiser(company: Company): Advertiser | null {
  if (!isAdvertiser(company)) return null;

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    contactName: company.contactName,
    contactPhone: company.contactPhone,
    contactEmail: company.contactEmail,
    cnpj: company.document,
    logoUrl: company.logoUrl,
    segment: company.segment,
    targetRadius: company.targetRadius,
    notes: company.notes,
    isActive: company.isActive,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

// Converter Condominium para Company
export function condominiumToCompany(condo: Condominium): Company {
  return {
    id: condo.id,
    name: condo.name,
    slug: condo.slug,
    personType: 'company',
    document: condo.cnpj,
    roles: {
      isScreenLocation: true,
      isAdvertiser: false,
    },
    logoUrl: condo.photoUrl,
    address: condo.address,
    city: condo.city,
    state: condo.state,
    latitude: condo.latitude,
    longitude: condo.longitude,
    category: condo.category,
    blockedCategories: condo.blockedCategories,
    blockOwnCategory: condo.blockOwnCategory,
    averageDailyTraffic: condo.averageDailyTraffic,
    pricing: condo.pricing,
    commission: condo.commission,
    whatsappPhone: condo.whatsappPhone,
    showNews: condo.showNews,
    isActive: condo.isActive ?? true,
    accountId: condo.accountId,
    createdAt: condo.createdAt,
    updatedAt: condo.updatedAt,
  };
}

// Converter Advertiser para Company
export function advertiserToCompany(adv: Advertiser): Company {
  return {
    id: adv.id,
    name: adv.name,
    slug: adv.slug,
    personType: 'company',
    document: adv.cnpj,
    roles: {
      isScreenLocation: false,
      isAdvertiser: true,
    },
    contactName: adv.contactName,
    contactPhone: adv.contactPhone,
    contactEmail: adv.contactEmail,
    logoUrl: adv.logoUrl,
    segment: adv.segment,
    targetRadius: adv.targetRadius,
    notes: adv.notes,
    isActive: adv.isActive,
    createdAt: adv.createdAt,
    updatedAt: adv.updatedAt,
  };
}

// ============================================
// PAGAMENTOS (MercadoPago)
// ============================================

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded' | 'in_process';
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto';
export type SubscriptionStatus = 'pending' | 'authorized' | 'paused' | 'cancelled';

// Pagamento individual (PIX, cartão, boleto)
export interface Payment {
  id: string;

  // MercadoPago
  mpPaymentId?: string;        // ID do pagamento no MercadoPago
  mpPreferenceId?: string;     // ID da preferência (checkout)

  // Asaas
  asaasPaymentId?: string;     // ID da cobrança no Asaas
  asaasCustomerId?: string;    // ID do cliente no Asaas
  asaasInvoiceUrl?: string;    // URL da fatura Asaas

  // Provider usado
  paymentProvider?: 'mercadopago' | 'asaas';

  // Quem está pagando
  accountId: string;           // Conta do operador/anunciante
  userId?: string;             // Usuário que fez o pagamento

  // Tipo de pagamento
  type: 'subscription' | 'one_time' | 'advertiser_campaign';

  // Valores
  amount: number;              // Valor em reais
  currency: string;            // BRL

  // Método de pagamento
  paymentMethod?: PaymentMethod;

  // Status
  status: PaymentStatus;
  statusDetail?: string;       // Detalhes do status (erro, etc)

  // PIX
  pixQrCode?: string;          // QR Code Base64
  pixQrCodeBase64?: string;    // QR Code para exibição
  pixCopiaECola?: string;      // Código copia e cola
  pixExpiresAt?: string;       // Expiração do PIX

  // Boleto
  boletoUrl?: string;          // URL do boleto
  boletoBarcode?: string;      // Código de barras
  boletoExpiresAt?: string;    // Vencimento

  // Referência
  description: string;         // Descrição do pagamento
  externalReference?: string;  // Referência externa (accountId, subscriptionId, etc)

  // Datas
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  refundedAt?: string;
}

// Assinatura recorrente (para operadores)
export interface Subscription {
  id: string;

  // MercadoPago
  mpSubscriptionId?: string;   // ID da assinatura no MercadoPago
  mpPlanId?: string;           // ID do plano

  // Asaas
  asaasSubscriptionId?: string;  // ID da assinatura no Asaas
  asaasCustomerId?: string;      // ID do cliente no Asaas

  // Provider usado
  paymentProvider?: 'mercadopago' | 'asaas';

  // Quem está assinando
  accountId: string;
  userId?: string;

  // Plano
  planType: 'operator_monthly';  // Tipo de plano

  // Valores
  amount: number;              // Valor mensal
  currency: string;            // BRL

  // Quantidade (monitores ativos)
  quantity: number;            // Número de monitores
  pricePerUnit: number;        // Preço por monitor (ex: R$35)

  // Status
  status: SubscriptionStatus;

  // Período
  billingDay: number;          // Dia do mês para cobrança (1-28)
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;

  // Datas
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;

  // Último pagamento
  lastPaymentId?: string;
  lastPaymentDate?: string;
  lastPaymentStatus?: PaymentStatus;
}

// Webhook do MercadoPago
export interface MercadoPagoWebhook {
  id: string;
  action: string;              // 'payment.created', 'payment.updated', etc
  type: string;                // 'payment', 'subscription', etc
  data: {
    id: string;                // ID do recurso
  };
  date_created: string;
  live_mode: boolean;
  user_id: string;
  api_version: string;
}

// Fatura/Invoice (para histórico)
export interface Invoice {
  id: string;

  // Referência
  paymentId: string;
  subscriptionId?: string;
  accountId: string;

  // Valores
  amount: number;
  currency: string;

  // Período (para assinaturas)
  periodStart?: string;
  periodEnd?: string;

  // Status
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

  // Dados fiscais
  description: string;
  items: InvoiceItem[];

  // Datas
  createdAt: string;
  paidAt?: string;
  dueDate?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ============================================
// SISTEMA DE MENUS DINÂMICOS
// ============================================

// Item de menu individual
export interface MenuItem {
  id: string;
  label: string;
  icon: string;           // Nome do ícone (heroicons)
  path?: string;          // URL ou ID da aba
  children?: MenuItem[];  // Submenus
  badge?: string | number; // Badge de notificação
  isNew?: boolean;        // Indicador de feature nova
}

// Grupo de menus (seção)
export interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

// Resposta da API /api/me/menu
export interface UserMenuResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string;
  };
  tenant: {
    id: string;
    name: string;
    type: TenantType;
    logoUrl?: string;
    primaryColor: string;
  } | null; // null para SUPER_ADMIN
  menu: MenuGroup[];
  permissions: Permission[];
  features: Record<string, boolean>;
}

// Configuração de menus por role e tenant type
export const MENU_CONFIG: Record<Role, {
  commercial: MenuGroup[];
  corporate: MenuGroup[];
}> = {
  SUPER_ADMIN: {
    commercial: [
      {
        id: 'platform',
        label: 'Plataforma',
        items: [
          { id: 'dashboard', label: 'Dashboard Global', icon: 'ChartBarIcon', path: '/admin' },
          { id: 'tenants', label: 'Tenants', icon: 'BuildingOfficeIcon', path: '/admin/tenants' },
          { id: 'platform-financial', label: 'Financeiro Global', icon: 'BanknotesIcon', path: '/admin/platform-financial' },
          { id: 'platform-affiliates', label: 'Afiliados Global', icon: 'UserGroupIcon', path: '/admin/affiliates' },
          { id: 'platform-settings', label: 'Configurações', icon: 'CogIcon', path: '/admin/platform-settings' },
        ],
      },
    ],
    corporate: [], // Super admin não usa modo corporativo diretamente
  },
  TENANT_ADMIN: {
    commercial: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'network',
        label: 'Rede',
        items: [
          { id: 'companies', label: 'Empresas', icon: 'BuildingOfficeIcon', path: 'companies' },
          { id: 'monitors', label: 'Telas', icon: 'TvIcon', path: 'monitors' },
        ],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        items: [
          { id: 'media', label: 'Mídias', icon: 'PhotoIcon', path: 'media' },
          { id: 'media-groups', label: 'Grupos de Mídias', icon: 'FolderIcon', path: 'media-groups' },
          { id: 'library', label: 'Biblioteca', icon: 'CloudArrowUpIcon', path: 'library' },
          { id: 'campaigns', label: 'Playlists', icon: 'MegaphoneIcon', path: 'campaigns' },
        ],
      },
      {
        id: 'advertising',
        label: 'Gestão de Anúncios',
        items: [
          { id: 'advertisers', label: 'Anunciantes', icon: 'UserGroupIcon', path: 'advertisers' },
          { id: 'contracts', label: 'Contratos', icon: 'DocumentTextIcon', path: 'contracts' },
        ],
      },
      {
        id: 'financial',
        label: 'Financeiro',
        items: [
          { id: 'financial', label: 'Pagamentos', icon: 'BanknotesIcon', path: 'financial' },
        ],
      },
      {
        id: 'affiliates',
        label: 'Afiliados',
        items: [
          { id: 'my-affiliate', label: 'Meu Link', icon: 'LinkIcon', path: 'my-affiliate' },
          { id: 'my-network', label: 'Minha Rede', icon: 'UsersIcon', path: 'my-network' },
          { id: 'affiliate-earnings', label: 'Extrato', icon: 'CurrencyDollarIcon', path: 'affiliate-earnings' },
        ],
      },
      {
        id: 'reports',
        label: 'Relatórios',
        items: [
          { id: 'reports', label: 'Relatórios', icon: 'DocumentChartBarIcon', path: 'reports' },
          { id: 'analytics', label: 'Analytics', icon: 'ChartBarIcon', path: 'analytics' },
        ],
      },
      {
        id: 'settings',
        label: 'Configurações',
        items: [
          { id: 'accounts', label: 'Contas', icon: 'BuildingStorefrontIcon', path: 'accounts' },
          { id: 'users', label: 'Usuários', icon: 'UsersIcon', path: 'users' },
          { id: 'settings', label: 'Configurações', icon: 'CogIcon', path: 'settings' },
        ],
      },
    ],
    corporate: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'network',
        label: 'Rede',
        items: [
          { id: 'companies', label: 'Unidades', icon: 'BuildingOfficeIcon', path: 'companies' },
          { id: 'monitors', label: 'Telas', icon: 'TvIcon', path: 'monitors' },
        ],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        items: [
          { id: 'media', label: 'Mídias', icon: 'PhotoIcon', path: 'media' },
          { id: 'media-groups', label: 'Grupos de Mídias', icon: 'FolderIcon', path: 'media-groups' },
          { id: 'library', label: 'Biblioteca', icon: 'CloudArrowUpIcon', path: 'library' },
          { id: 'campaigns', label: 'Playlists', icon: 'MegaphoneIcon', path: 'campaigns' },
        ],
      },
      {
        id: 'internal',
        label: 'Comunicação Interna',
        items: [
          { id: 'mural', label: 'Mural Digital', icon: 'NewspaperIcon', path: 'mural' },
          { id: 'announcements', label: 'Comunicados', icon: 'SpeakerWaveIcon', path: 'announcements' },
          { id: 'birthdays', label: 'Aniversariantes', icon: 'CakeIcon', path: 'birthdays' },
          { id: 'goals', label: 'Metas e KPIs', icon: 'TrophyIcon', path: 'goals' },
        ],
      },
      {
        id: 'affiliates',
        label: 'Afiliados',
        items: [
          { id: 'my-affiliate', label: 'Meu Link', icon: 'LinkIcon', path: 'my-affiliate' },
          { id: 'my-network', label: 'Minha Rede', icon: 'UsersIcon', path: 'my-network' },
          { id: 'affiliate-earnings', label: 'Extrato', icon: 'CurrencyDollarIcon', path: 'affiliate-earnings' },
        ],
      },
      {
        id: 'settings',
        label: 'Configurações',
        items: [
          { id: 'users', label: 'Usuários', icon: 'UsersIcon', path: 'users' },
          { id: 'settings', label: 'Configurações', icon: 'CogIcon', path: 'settings' },
        ],
      },
    ],
  },
  TENANT_MANAGER: {
    commercial: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'network',
        label: 'Rede',
        items: [
          { id: 'companies', label: 'Empresas', icon: 'BuildingOfficeIcon', path: 'companies' },
          { id: 'monitors', label: 'Telas', icon: 'TvIcon', path: 'monitors' },
        ],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        items: [
          { id: 'media', label: 'Mídias', icon: 'PhotoIcon', path: 'media' },
          { id: 'campaigns', label: 'Playlists', icon: 'MegaphoneIcon', path: 'campaigns' },
        ],
      },
      {
        id: 'advertising',
        label: 'Gestão de Anúncios',
        items: [
          { id: 'advertisers', label: 'Anunciantes', icon: 'UserGroupIcon', path: 'advertisers' },
          { id: 'contracts', label: 'Contratos', icon: 'DocumentTextIcon', path: 'contracts' },
        ],
      },
      {
        id: 'reports',
        label: 'Relatórios',
        items: [
          { id: 'reports', label: 'Relatórios', icon: 'DocumentChartBarIcon', path: 'reports' },
        ],
      },
    ],
    corporate: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'network',
        label: 'Rede',
        items: [
          { id: 'companies', label: 'Unidades', icon: 'BuildingOfficeIcon', path: 'companies' },
          { id: 'monitors', label: 'Telas', icon: 'TvIcon', path: 'monitors' },
        ],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        items: [
          { id: 'media', label: 'Mídias', icon: 'PhotoIcon', path: 'media' },
          { id: 'campaigns', label: 'Playlists', icon: 'MegaphoneIcon', path: 'campaigns' },
        ],
      },
      {
        id: 'internal',
        label: 'Comunicação Interna',
        items: [
          { id: 'mural', label: 'Mural Digital', icon: 'NewspaperIcon', path: 'mural' },
          { id: 'announcements', label: 'Comunicados', icon: 'SpeakerWaveIcon', path: 'announcements' },
        ],
      },
    ],
  },
  LOCATION_OWNER: {
    commercial: [
      {
        id: 'main',
        label: 'Meu Ponto',
        items: [
          { id: 'my-screens', label: 'Minhas Telas', icon: 'TvIcon', path: 'my-screens' },
          { id: 'send-notice', label: 'Enviar Aviso', icon: 'MegaphoneIcon', path: 'send-notice' },
          { id: 'my-reports', label: 'Relatórios', icon: 'DocumentChartBarIcon', path: 'my-reports' },
        ],
      },
    ],
    corporate: [
      {
        id: 'main',
        label: 'Minha Unidade',
        items: [
          { id: 'my-screens', label: 'Minhas Telas', icon: 'TvIcon', path: 'my-screens' },
          { id: 'send-notice', label: 'Enviar Aviso', icon: 'MegaphoneIcon', path: 'send-notice' },
        ],
      },
    ],
  },
  ADVERTISER: {
    commercial: [
      {
        id: 'main',
        label: 'Minhas Campanhas',
        items: [
          { id: 'my-campaigns', label: 'Campanhas', icon: 'MegaphoneIcon', path: 'my-campaigns' },
          { id: 'proof-of-play', label: 'Proof of Play', icon: 'CheckCircleIcon', path: 'proof-of-play' },
          { id: 'my-invoices', label: 'Faturas', icon: 'DocumentTextIcon', path: 'my-invoices' },
        ],
      },
    ],
    corporate: [], // Anunciantes não existem em modo corporativo
  },
  OPERATOR: {
    commercial: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        items: [
          { id: 'media', label: 'Mídias', icon: 'PhotoIcon', path: 'media' },
          { id: 'campaigns', label: 'Playlists', icon: 'MegaphoneIcon', path: 'campaigns' },
          { id: 'monitors', label: 'Telas', icon: 'TvIcon', path: 'monitors' },
        ],
      },
    ],
    corporate: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        items: [
          { id: 'media', label: 'Mídias', icon: 'PhotoIcon', path: 'media' },
          { id: 'campaigns', label: 'Playlists', icon: 'MegaphoneIcon', path: 'campaigns' },
          { id: 'monitors', label: 'Telas', icon: 'TvIcon', path: 'monitors' },
        ],
      },
      {
        id: 'internal',
        label: 'Comunicação Interna',
        items: [
          { id: 'mural', label: 'Mural Digital', icon: 'NewspaperIcon', path: 'mural' },
          { id: 'announcements', label: 'Comunicados', icon: 'SpeakerWaveIcon', path: 'announcements' },
        ],
      },
    ],
  },
  SALES_AGENT: {
    commercial: [
      {
        id: 'main',
        label: 'Principal',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: 'HomeIcon', path: 'dashboard' },
        ],
      },
      {
        id: 'sales',
        label: 'Vendas',
        items: [
          { id: 'simulator', label: 'Simulador', icon: 'CalculatorIcon', path: 'simulator' },
          { id: 'advertisers', label: 'Clientes', icon: 'UserGroupIcon', path: 'advertisers' },
          { id: 'contracts', label: 'Contratos', icon: 'DocumentTextIcon', path: 'contracts' },
        ],
      },
      {
        id: 'financial',
        label: 'Minhas Comissões',
        items: [
          { id: 'sales-commissions', label: 'Extrato', icon: 'CurrencyDollarIcon', path: 'sales-commissions' },
        ],
      },
    ],
    corporate: [], // Vendedores externos não operam em modo corporativo
  },
};

// Função para obter o menu do usuário
export function getUserMenu(user: User, tenant: Tenant | null): MenuGroup[] {
  const role = user.role as Role;
  const tenantType = tenant?.type || 'NETWORK_OPERATOR';

  const menuConfig = MENU_CONFIG[role];
  if (!menuConfig) return [];

  // commercial = NETWORK_OPERATOR, corporate = CORPORATE_CLIENT
  const menus = tenantType === 'CORPORATE_CLIENT' ? menuConfig.corporate : menuConfig.commercial;
  return menus || [];
}

// Feature toggles por tipo de tenant
export const FEATURE_TOGGLES: Record<TenantType, Record<string, boolean>> = {
  NETWORK_OPERATOR: {
    advertisers: true,
    campaigns: true,
    contracts: true,
    pricing: true,
    medals: true,
    commissions: true,
    mural: false,
    birthdays: false,
    goals: false,
    internalComms: false,
    library: true,
    playlists: true,
    widgets: true,
    whitelabel: true,
    affiliates: true,
  },
  CORPORATE_CLIENT: {
    advertisers: false,
    campaigns: false,
    contracts: false,
    pricing: false,
    medals: false,
    commissions: false,
    mural: true,
    birthdays: true,
    goals: true,
    internalComms: true,
    library: true,
    playlists: true,
    widgets: true,
    whitelabel: true,
    affiliates: true,
  },
};

// Verificar se feature está habilitada para o tenant
export function isFeatureEnabled(feature: string, tenantType: TenantType): boolean {
  return FEATURE_TOGGLES[tenantType]?.[feature] ?? false;
}

// ============================================
// SISTEMA DE AFILIADOS
// ============================================

// Comissão de afiliado
export interface AffiliateCommission {
  id: string;
  earnerId: string;        // Quem ganha a comissão
  earnerName: string;
  sourceTenantId: string;  // Tenant que gerou a comissão
  sourceTenantName: string;
  level: 1 | 2;            // Nível da comissão (1 = direto, 2 = indireto)
  rate: number;            // Taxa (0.10 = 10%)
  baseAmount: number;      // Valor base da assinatura
  amount: number;          // Valor da comissão
  periodStart: string;
  periodEnd: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

// ============================================
// SISTEMA DE AFILIADOS LEGADO (compatibilidade)
// Mantido para backward compatibility
// ============================================

// Configurações legadas (mapeiam para as novas)
export interface LegacyAffiliateSettings {
  enabled: boolean;
  level1Rate: number;      // 0.10 = 10%
  level2Rate: number;      // 0.05 = 5%
  maxDepth: number;        // 2
  lockDays: number;        // 30 dias antes de liberar comissão
}

// Valores padrão legados
export const LEGACY_AFFILIATE_SETTINGS: LegacyAffiliateSettings = {
  enabled: true,
  level1Rate: 0.10,
  level2Rate: 0.05,
  maxDepth: 2,
  lockDays: 30,
};

// Cálculo de comissões de afiliado (legado)
export interface LegacyAffiliateCommissionCalculation {
  level1?: {
    userId: string;
    userName: string;
    rate: number;
    amount: number;
  };
  level2?: {
    userId: string;
    userName: string;
    rate: number;
    amount: number;
  };
  totalCommissions: number;
  platformRetains: number;
}

// Função legada para calcular comissões de afiliado
export function calculateLegacyAffiliateCommissions(
  monthlyFee: number,
  referrerChain: Array<{ id: string; name: string; depth: number }>,
  settings: LegacyAffiliateSettings = LEGACY_AFFILIATE_SETTINGS
): LegacyAffiliateCommissionCalculation {
  const result: LegacyAffiliateCommissionCalculation = {
    totalCommissions: 0,
    platformRetains: monthlyFee,
  };

  if (!settings.enabled || referrerChain.length === 0) {
    return result;
  }

  // Nível 1 - Indicador direto
  const level1 = referrerChain.find(r => r.depth === 1);
  if (level1) {
    const amount = monthlyFee * settings.level1Rate;
    result.level1 = {
      userId: level1.id,
      userName: level1.name,
      rate: settings.level1Rate,
      amount,
    };
    result.totalCommissions += amount;
  }

  // Nível 2 - Indicador do indicador (se permitido)
  if (settings.maxDepth >= 2) {
    const level2 = referrerChain.find(r => r.depth === 2);
    if (level2) {
      const amount = monthlyFee * settings.level2Rate;
      result.level2 = {
        userId: level2.id,
        userName: level2.name,
        rate: settings.level2Rate,
        amount,
      };
      result.totalCommissions += amount;
    }
  }

  // TRAVA: Não continua além do maxDepth
  result.platformRetains = monthlyFee - result.totalCommissions;

  return result;
}

// Estatísticas de afiliado (legado)
export interface LegacyAffiliateStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;       // Total de indicados diretos
  activeReferrals: number;      // Indicados ativos
  totalNetwork: number;         // Total na rede (nível 1 + 2)
  pendingCommissions: number;   // Comissões pendentes (R$)
  paidCommissions: number;      // Comissões pagas (R$)
  thisMonthCommissions: number; // Comissões este mês (R$)
}

// ============================================
// VALIDAÇÃO DE PLAYLIST E ORIENTAÇÃO
// ============================================

// Orientação de mídia/tela (compatível com Prisma)
export type MediaOrientation = 'HORIZONTAL' | 'VERTICAL';

// Dimensões padrão por orientação
export const ORIENTATION_DIMENSIONS: Record<MediaOrientation, { width: number; height: number; label: string }> = {
  HORIZONTAL: { width: 1920, height: 1080, label: 'Paisagem (1920x1080)' },
  VERTICAL: { width: 1080, height: 1920, label: 'Retrato/Totem (1080x1920)' },
};

// Labels para estratégias de violação de loop
export const LOOP_VIOLATION_LABELS: Record<LoopViolationStrategy, string> = {
  WARNING: 'Apenas Avisar',
  BLOCK: 'Bloquear Salvamento',
};

// Item de playlist para validação
export interface PlaylistItemForValidation {
  id: string;
  mediaId: string;
  mediaName?: string;
  mediaOrientation?: MediaOrientation;
  duration: number; // Duração em segundos
}

// Resultado da validação de playlist
export interface PlaylistValidationResult {
  isValid: boolean;
  totalDuration: number;           // Duração total em segundos
  targetDuration: number;          // Duração alvo em segundos
  exceedsTarget: boolean;          // Se excede o alvo
  exceededBy: number;              // Quanto excede (em segundos)
  percentageOfTarget: number;      // Porcentagem do alvo (ex: 120 = 120%)
  strategy: LoopViolationStrategy; // Estratégia configurada
  canSave: boolean;                // Se pode salvar (false se BLOCK e exceder)
  warnings: string[];              // Lista de avisos
  errors: string[];                // Lista de erros
  itemsCount: number;              // Número de itens
  averageSlotDuration: number;     // Duração média dos slots
}

/**
 * Valida a duração total de uma playlist
 * @param items Itens da playlist com duração
 * @param config Configurações de validação do tenant
 * @returns Resultado da validação
 */
export function validatePlaylistDuration(
  items: PlaylistItemForValidation[],
  config: PlaylistValidationConfig = DEFAULT_PLAYLIST_CONFIG
): PlaylistValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Calcular duração total
  const totalDuration = items.reduce((sum, item) => sum + (item.duration || config.defaultSlotDuration), 0);
  const itemsCount = items.length;
  const averageSlotDuration = itemsCount > 0 ? totalDuration / itemsCount : 0;

  // Verificar se excede o alvo
  const exceedsTarget = totalDuration > config.targetLoopDuration;
  const exceededBy = exceedsTarget ? totalDuration - config.targetLoopDuration : 0;
  const percentageOfTarget = config.targetLoopDuration > 0
    ? Math.round((totalDuration / config.targetLoopDuration) * 100)
    : 0;

  // Verificar slots individuais
  items.forEach((item, index) => {
    const duration = item.duration || config.defaultSlotDuration;
    if (duration < config.minSlotDuration) {
      warnings.push(`Item ${index + 1} (${item.mediaName || item.mediaId}): duração de ${duration}s é menor que o mínimo de ${config.minSlotDuration}s`);
    }
    if (duration > config.maxSlotDuration) {
      warnings.push(`Item ${index + 1} (${item.mediaName || item.mediaId}): duração de ${duration}s excede o máximo de ${config.maxSlotDuration}s`);
    }
  });

  // Verificar excesso de duração
  if (exceedsTarget) {
    const message = `Playlist excede a duração alvo em ${formatDuration(exceededBy)} (${percentageOfTarget}% do alvo de ${formatDuration(config.targetLoopDuration)})`;

    if (config.loopViolationStrategy === 'BLOCK') {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  // Determinar se pode salvar
  const canSave = config.loopViolationStrategy === 'WARNING' || !exceedsTarget;
  const isValid = errors.length === 0;

  return {
    isValid,
    totalDuration,
    targetDuration: config.targetLoopDuration,
    exceedsTarget,
    exceededBy,
    percentageOfTarget,
    strategy: config.loopViolationStrategy,
    canSave,
    warnings,
    errors,
    itemsCount,
    averageSlotDuration: Math.round(averageSlotDuration),
  };
}

/**
 * Formata duração em segundos para string legível
 * @param seconds Duração em segundos
 * @returns String formatada (ex: "20min 30s")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}min`;
  }
  return `${minutes}min ${remainingSeconds}s`;
}

// Resultado da validação de orientação
export interface OrientationValidationResult {
  isCompatible: boolean;
  mediaOrientation: MediaOrientation;
  screenOrientation: MediaOrientation;
  warning?: string;
  recommendation?: string;
}

/**
 * Valida compatibilidade de orientação entre mídia e tela
 * @param mediaOrientation Orientação da mídia
 * @param screenOrientation Orientação da tela
 * @returns Resultado da validação
 */
export function validateMediaScreenOrientation(
  mediaOrientation: MediaOrientation,
  screenOrientation: MediaOrientation
): OrientationValidationResult {
  const isCompatible = mediaOrientation === screenOrientation;

  if (isCompatible) {
    return {
      isCompatible: true,
      mediaOrientation,
      screenOrientation,
    };
  }

  // Mídia horizontal em tela vertical
  if (mediaOrientation === 'HORIZONTAL' && screenOrientation === 'VERTICAL') {
    return {
      isCompatible: false,
      mediaOrientation,
      screenOrientation,
      warning: 'Mídia horizontal (1920x1080) em tela vertical (1080x1920) causará distorção ou barras pretas',
      recommendation: 'Use uma mídia vertical ou converta o arquivo para orientação retrato',
    };
  }

  // Mídia vertical em tela horizontal
  return {
    isCompatible: false,
    mediaOrientation,
    screenOrientation,
    warning: 'Mídia vertical (1080x1920) em tela horizontal (1920x1080) causará distorção ou barras pretas',
    recommendation: 'Use uma mídia horizontal ou converta o arquivo para orientação paisagem',
  };
}

/**
 * Detecta orientação automaticamente baseado nas dimensões
 * @param width Largura em pixels
 * @param height Altura em pixels
 * @returns Orientação detectada
 */
export function detectOrientation(width: number, height: number): MediaOrientation {
  return width >= height ? 'HORIZONTAL' : 'VERTICAL';
}

/**
 * Valida todos os itens de uma playlist quanto à orientação
 * @param items Itens da playlist com orientação
 * @param screenOrientation Orientação da tela de destino
 * @returns Lista de incompatibilidades
 */
export function validatePlaylistOrientation(
  items: PlaylistItemForValidation[],
  screenOrientation: MediaOrientation
): Array<{ item: PlaylistItemForValidation; validation: OrientationValidationResult }> {
  return items
    .filter(item => item.mediaOrientation && item.mediaOrientation !== screenOrientation)
    .map(item => ({
      item,
      validation: validateMediaScreenOrientation(item.mediaOrientation!, screenOrientation),
    }));
}

// Resultado completo de validação de playlist
export interface FullPlaylistValidationResult {
  duration: PlaylistValidationResult;
  orientationIssues: Array<{ item: PlaylistItemForValidation; validation: OrientationValidationResult }>;
  canSave: boolean;
  hasWarnings: boolean;
  hasErrors: boolean;
  summary: string;
}

/**
 * Validação completa de playlist (duração + orientação)
 * @param items Itens da playlist
 * @param screenOrientation Orientação da tela de destino
 * @param config Configurações de validação
 * @returns Resultado completo da validação
 */
export function validatePlaylist(
  items: PlaylistItemForValidation[],
  screenOrientation: MediaOrientation,
  config: PlaylistValidationConfig = DEFAULT_PLAYLIST_CONFIG
): FullPlaylistValidationResult {
  const duration = validatePlaylistDuration(items, config);
  const orientationIssues = validatePlaylistOrientation(items, screenOrientation);

  const hasOrientationWarnings = orientationIssues.length > 0;
  const hasWarnings = duration.warnings.length > 0 || hasOrientationWarnings;
  const hasErrors = duration.errors.length > 0;
  const canSave = duration.canSave; // Orientação não bloqueia, apenas avisa

  // Gerar resumo
  const summaryParts: string[] = [];

  if (hasErrors) {
    summaryParts.push(`${duration.errors.length} erro(s)`);
  }
  if (duration.warnings.length > 0) {
    summaryParts.push(`${duration.warnings.length} aviso(s) de duração`);
  }
  if (hasOrientationWarnings) {
    summaryParts.push(`${orientationIssues.length} mídia(s) com orientação incompatível`);
  }

  const summary = summaryParts.length > 0
    ? `Playlist com ${summaryParts.join(', ')}`
    : 'Playlist válida';

  return {
    duration,
    orientationIssues,
    canSave,
    hasWarnings,
    hasErrors,
    summary,
  };
}

// ============================================
// GESTÃO DE EQUIPE COMERCIAL (Sales Team)
// ============================================

// Status do contrato
export type ContractStatusType =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SUSPENDED';

// Labels para status do contrato
export const CONTRACT_STATUS_TYPE_LABELS: Record<ContractStatusType, string> = {
  DRAFT: 'Rascunho',
  PENDING_SIGNATURE: 'Aguardando Assinatura',
  ACTIVE: 'Ativo',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  SUSPENDED: 'Suspenso',
};

// Cores para status do contrato
export const CONTRACT_STATUS_TYPE_COLORS: Record<ContractStatusType, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  PENDING_SIGNATURE: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  COMPLETED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
  SUSPENDED: { bg: 'bg-orange-100', text: 'text-orange-700' },
};

// Status do ledger de comissão
export type CommissionLedgerStatusType = 'PENDING' | 'PAID' | 'CANCELLED';

// Labels para status do ledger
export const COMMISSION_LEDGER_STATUS_LABELS: Record<CommissionLedgerStatusType, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

// Cores para status do ledger
export const COMMISSION_LEDGER_STATUS_COLORS: Record<CommissionLedgerStatusType, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  PAID: { bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

// Dados de pagamento do vendedor
export interface SalesAgentPaymentDetails {
  pixKey?: string;
  pixType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  bankCode?: string;
  bankName?: string;
  agency?: string;
  account?: string;
  accountType?: 'checking' | 'savings';
}

// Vendedor/Agente de Vendas
export interface SalesAgent {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string; // CPF

  // Comissão padrão (sugestão para novos contratos)
  defaultCommissionRate: number; // Ex: 30.0 = 30%

  // Dados de pagamento
  paymentDetails?: SalesAgentPaymentDetails;

  // Status
  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  // Computed fields (para UI)
  totalContracts?: number;
  activeContracts?: number;
  totalCommissionsPending?: number;
  totalCommissionsPaid?: number;
}

// Contrato com vendedor (extensão do tipo Contract existente)
export interface ContractWithSalesAgent extends Contract {
  salesAgentId?: string;
  salesAgent?: SalesAgent;
  commissionRateSnapshot?: number; // CRÍTICO: taxa congelada no momento da criação
  billingDay?: number;
}

// Fatura do contrato
export interface ContractInvoice {
  id: string;
  tenantId: string;
  contractId: string;
  invoiceNumber?: string;
  amount: number;
  dueDate: string;
  referenceMonth: string; // Mês de competência

  status: PaymentStatus;
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;

  // External payment
  externalId?: string;
  pixQrCode?: string;
  pixCopiaECola?: string;
  boletoUrl?: string;
  boletoBarcode?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Registro do ledger de comissão
export interface CommissionLedgerEntry {
  id: string;
  tenantId: string;
  salesAgentId: string;
  salesAgent?: SalesAgent;
  contractId: string;
  contract?: ContractWithSalesAgent;
  invoiceId: string;
  invoice?: ContractInvoice;

  // Detalhes da comissão
  amount: number;       // Valor da comissão calculada
  rate: number;         // Taxa usada (snapshot do contrato)
  baseAmount: number;   // Valor base (valor da fatura)

  referenceMonth: string; // Mês de competência

  status: CommissionLedgerStatusType;
  paidAt?: string;
  paidBy?: string;

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Resumo de comissões por vendedor
export interface SalesAgentCommissionSummary {
  salesAgentId: string;
  salesAgentName: string;
  period: string; // YYYY-MM

  // Totais
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;

  // Contagem
  pendingCount: number;
  paidCount: number;

  // Detalhes
  entries: CommissionLedgerEntry[];
}

// Input para criar contrato com vendedor
export interface CreateContractWithSalesAgentInput {
  tenantId: string;
  advertiserId: string;
  salesAgentId?: string;

  title: string;
  description?: string;
  value: number;

  // Comissão (pode ser editada antes de salvar)
  commissionRate?: number; // Se não informada, usa a padrão do vendedor

  startDate: string;
  endDate: string;
  billingDay?: number;
  paymentMethod?: string;
}

// Resultado do cálculo de comissão
export interface CommissionCalculationResult {
  invoiceAmount: number;
  commissionRate: number;
  commissionAmount: number;
  salesAgentId: string;
  salesAgentName: string;
  contractId: string;
  contractPartyBName: string; // Nome do cliente (partyB)
}

/**
 * Calcula a comissão de uma fatura paga
 * REGRA CRÍTICA: Usa SEMPRE o commissionRateSnapshot do contrato,
 * NUNCA a taxa atual do vendedor (Direito Adquirido)
 */
export function calculateSalesCommission(
  invoiceAmount: number,
  contract: ContractWithSalesAgent,
  salesAgent: SalesAgent
): CommissionCalculationResult | null {
  // Verificar se o contrato tem vendedor vinculado
  if (!contract.salesAgentId || !contract.commissionRateSnapshot) {
    return null;
  }

  // CRÍTICO: Usar a taxa do snapshot, não a taxa atual do vendedor
  const commissionRate = contract.commissionRateSnapshot;
  const commissionAmount = (invoiceAmount * commissionRate) / 100;

  return {
    invoiceAmount,
    commissionRate,
    commissionAmount: Math.round(commissionAmount * 100) / 100, // Arredondar para 2 casas
    salesAgentId: contract.salesAgentId!,
    salesAgentName: salesAgent.name,
    contractId: contract.id,
    contractPartyBName: contract.partyBName || '',
  };
}

/**
 * Processa o pagamento de uma fatura e gera entrada no ledger de comissão
 * Deve ser chamado quando Invoice.status muda para PAID
 */
export interface ProcessInvoicePaidInput {
  invoice: ContractInvoice;
  contract: ContractWithSalesAgent;
  salesAgent: SalesAgent;
}

export interface ProcessInvoicePaidResult {
  success: boolean;
  commissionEntry?: CommissionLedgerEntry;
  error?: string;
}

/**
 * Lógica de processamento quando uma fatura é paga
 * Algoritmo:
 * 1. Verificar se a Invoice pertence a um Contrato com sales_agent_id
 * 2. Verificar se o Contrato está ACTIVE
 * 3. Calcular: Invoice.amount * Contract.commission_rate_snapshot / 100
 * 4. Inserir registro na tabela CommissionLedger com status 'PENDING'
 */
export function processInvoicePaid(input: ProcessInvoicePaidInput): ProcessInvoicePaidResult {
  const { invoice, contract, salesAgent } = input;

  // Verificar se o contrato tem vendedor vinculado
  if (!contract.salesAgentId) {
    return {
      success: true, // Não é erro, apenas não tem vendedor
      error: 'Contrato não possui vendedor vinculado',
    };
  }

  // Verificar se o contrato está ativo (suporta lowercase e UPPERCASE)
  const statusLower = contract.status?.toLowerCase();
  if (statusLower !== 'active' && statusLower !== 'signed') {
    return {
      success: false,
      error: 'Contrato não está ativo',
    };
  }

  // Verificar se tem taxa de comissão
  if (!contract.commissionRateSnapshot || contract.commissionRateSnapshot <= 0) {
    return {
      success: true,
      error: 'Contrato não possui taxa de comissão definida',
    };
  }

  // Calcular comissão
  const calculation = calculateSalesCommission(invoice.amount, contract, salesAgent);

  if (!calculation) {
    return {
      success: false,
      error: 'Não foi possível calcular a comissão',
    };
  }

  // Criar entrada do ledger (usa tenantId da invoice que já é obrigatório)
  const commissionEntry: CommissionLedgerEntry = {
    id: '', // Será gerado pelo banco
    tenantId: invoice.tenantId,
    salesAgentId: calculation.salesAgentId,
    contractId: calculation.contractId,
    invoiceId: invoice.id,
    amount: calculation.commissionAmount,
    rate: calculation.commissionRate,
    baseAmount: invoice.amount,
    referenceMonth: invoice.referenceMonth,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    success: true,
    commissionEntry,
  };
}

// Filtros para relatório de comissões
export interface CommissionReportFilters {
  tenantId: string;
  salesAgentId?: string;
  startMonth?: string; // YYYY-MM
  endMonth?: string;   // YYYY-MM
  status?: CommissionLedgerStatusType;
}

// Resumo do relatório de comissões
export interface CommissionReportSummary {
  filters: CommissionReportFilters;
  totalPending: number;
  totalPaid: number;
  totalCancelled: number;
  grandTotal: number;
  entriesCount: number;
  byAgent: SalesAgentCommissionSummary[];
}

/**
 * Obtém a taxa de comissão para um novo contrato
 * Se o vendedor for selecionado, usa a taxa padrão dele como sugestão
 * Esta taxa pode ser editada pelo admin antes de salvar o contrato
 */
export function getDefaultCommissionRate(salesAgent: SalesAgent | null): number {
  if (!salesAgent) {
    return 0;
  }
  return salesAgent.defaultCommissionRate;
}

/**
 * Valida se a taxa de comissão está dentro dos limites aceitáveis
 */
export function validateCommissionRate(rate: number): { valid: boolean; error?: string } {
  if (rate < 0) {
    return { valid: false, error: 'Taxa de comissão não pode ser negativa' };
  }
  if (rate > 100) {
    return { valid: false, error: 'Taxa de comissão não pode ser maior que 100%' };
  }
  return { valid: true };
}

// ============================================
// SISTEMA DE AFILIADOS (Growth/Referral)
// ============================================

// Status do ledger de afiliados
export type AffiliateLedgerStatusType = 'PENDING' | 'AVAILABLE' | 'PAID' | 'CANCELLED';

// Labels para status do ledger de afiliados
export const AFFILIATE_LEDGER_STATUS_LABELS: Record<AffiliateLedgerStatusType, string> = {
  PENDING: 'Aguardando',
  AVAILABLE: 'Disponível',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

// Cores para status do ledger de afiliados
export const AFFILIATE_LEDGER_STATUS_COLORS: Record<AffiliateLedgerStatusType, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  AVAILABLE: { bg: 'bg-green-100', text: 'text-green-700' },
  PAID: { bg: 'bg-blue-100', text: 'text-blue-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

// Configurações de afiliados (armazenadas em PlatformSettings)
export interface AffiliateSettings {
  affiliateEnabled: boolean;
  affiliateL1Percentage: number;  // Taxa nível 1 (indicação direta) - Ex: 20.0 = 20%
  affiliateL2Percentage: number;  // Taxa nível 2 (indicação indireta) - Ex: 5.0 = 5%
  affiliateCookieDuration: number; // Dias de validade do cookie
  affiliateLockDays: number;      // Dias antes de comissão ficar disponível
  affiliateMinWithdrawal: number; // Valor mínimo para saque
}

// Valores padrão das configurações de afiliados
// IMPORTANTE: Use DEFAULT_PLATFORM_SETTINGS como fonte de verdade
export const DEFAULT_AFFILIATE_SETTINGS: AffiliateSettings = {
  affiliateEnabled: true,
  affiliateL1Percentage: 10.0,  // CORRIGIDO: 10% (não 20%)
  affiliateL2Percentage: 5.0,
  affiliateCookieDuration: 60,
  affiliateLockDays: 30,
  affiliateMinWithdrawal: 50.0,
};

// Entrada no ledger de afiliados
export interface AffiliateLedgerEntry {
  id: string;
  affiliateId: string;        // Quem recebe
  sourceUserId: string;       // Quem pagou a fatura
  sourceTenantId: string;     // Tenant de origem
  subscriptionInvoiceId?: string;

  tier: 1 | 2;                // 1 = Pai (direto), 2 = Avô (indireto)
  percentageApplied: number;  // Snapshot da taxa usada
  baseAmount: number;         // Valor da fatura
  amount: number;             // Valor da comissão

  referenceMonth: string;
  status: AffiliateLedgerStatusType;
  availableAt?: string;
  paidAt?: string;
  paidBy?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;

  // Campos computados para UI
  affiliate?: {
    id: string;
    name: string;
    email: string;
  };
  sourceUser?: {
    id: string;
    name: string;
    email: string;
  };
}

// Estatísticas do afiliado
export interface AffiliateStats {
  affiliateCode: string;
  totalReferrals: number;       // Total de indicados diretos (Tier 1)
  tier1Earnings: number;        // Total ganho como Pai
  tier2Earnings: number;        // Total ganho como Avô
  totalEarnings: number;        // Total geral
  pendingBalance: number;       // Saldo pendente (em lock)
  availableBalance: number;     // Saldo disponível para saque
  paidTotal: number;            // Total já sacado
  recentReferrals: Array<{
    id: string;
    name: string;
    tenantName: string;
    createdAt: string;
  }>;
}

// Input para processar pagamento de assinatura SaaS
export interface ProcessSaaSPaymentInput {
  tenantId: string;
  userId: string;              // Dono do tenant que pagou
  invoiceId: string;
  invoiceAmount: number;
  referenceMonth: string;
}

// Resultado do processamento
export interface ProcessSaaSPaymentResult {
  success: boolean;
  entriesCreated: AffiliateLedgerEntry[];
  errors?: string[];
}

/**
 * Calcula comissões de afiliados quando uma fatura SaaS é paga
 * REGRA CRÍTICA: O sistema DEVE PARAR no Nível 2 (não calcular Nível 3+)
 *
 * Algoritmo:
 * 1. Carregar configurações atuais de affiliate_l1_percentage e affiliate_l2_percentage
 * 2. Verificar se o usuário que pagou tem referrer_id (Nível 1 - Pai)
 * 3. Se sim, calcular: invoiceAmount * (l1_percentage / 100)
 * 4. Verificar se o "Pai" tem referrer_id (Nível 2 - Avô)
 * 5. Se sim, calcular: invoiceAmount * (l2_percentage / 100)
 * 6. PARAR - não calcular Nível 3
 */
export function calculateAffiliateCommissions(
  input: ProcessSaaSPaymentInput,
  settings: AffiliateSettings,
  userChain: {
    payer: { id: string; referrerId?: string };
    level1Referrer?: { id: string; referrerId?: string };
    level2Referrer?: { id: string };
  }
): { tier1?: Omit<AffiliateLedgerEntry, 'id' | 'createdAt' | 'updatedAt'>; tier2?: Omit<AffiliateLedgerEntry, 'id' | 'createdAt' | 'updatedAt'> } {
  const result: { tier1?: Omit<AffiliateLedgerEntry, 'id' | 'createdAt' | 'updatedAt'>; tier2?: Omit<AffiliateLedgerEntry, 'id' | 'createdAt' | 'updatedAt'> } = {};

  // Verificar se o sistema de afiliados está habilitado
  if (!settings.affiliateEnabled) {
    return result;
  }

  // Calcular data de disponibilidade (após lock period)
  const availableAt = new Date();
  availableAt.setDate(availableAt.getDate() + settings.affiliateLockDays);

  // NÍVEL 1: Indicação direta (Pai)
  if (userChain.payer.referrerId && userChain.level1Referrer) {
    const tier1Amount = (input.invoiceAmount * settings.affiliateL1Percentage) / 100;

    result.tier1 = {
      affiliateId: userChain.level1Referrer.id,
      sourceUserId: userChain.payer.id,
      sourceTenantId: input.tenantId,
      subscriptionInvoiceId: input.invoiceId,
      tier: 1,
      percentageApplied: settings.affiliateL1Percentage,
      baseAmount: input.invoiceAmount,
      amount: Math.round(tier1Amount * 100) / 100,
      referenceMonth: input.referenceMonth,
      status: 'PENDING',
      availableAt: availableAt.toISOString(),
    };

    // NÍVEL 2: Indicação indireta (Avô) - SOMENTE se tier 1 existe
    if (userChain.level1Referrer.referrerId && userChain.level2Referrer) {
      const tier2Amount = (input.invoiceAmount * settings.affiliateL2Percentage) / 100;

      result.tier2 = {
        affiliateId: userChain.level2Referrer.id,
        sourceUserId: userChain.payer.id,
        sourceTenantId: input.tenantId,
        subscriptionInvoiceId: input.invoiceId,
        tier: 2,
        percentageApplied: settings.affiliateL2Percentage,
        baseAmount: input.invoiceAmount,
        amount: Math.round(tier2Amount * 100) / 100,
        referenceMonth: input.referenceMonth,
        status: 'PENDING',
        availableAt: availableAt.toISOString(),
      };
    }
    // TRAVA DE SEGURANÇA: NÃO calcular Nível 3+
  }

  return result;
}

/**
 * Gera um código de afiliado amigável
 * Formato: NOME + números aleatórios (ex: "MARIA10", "JOAO42")
 */
export function generateAffiliateCode(name: string): string {
  const cleanName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z]/g, '')       // Remove não-letras
    .toUpperCase()
    .slice(0, 6);                    // Max 6 letras

  const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');

  return `${cleanName}${numbers}`;
}

/**
 * Valida se um código de afiliado é válido
 */
export function validateAffiliateCode(code: string): boolean {
  // Deve ter entre 4 e 10 caracteres, apenas letras e números
  return /^[A-Z0-9]{4,10}$/i.test(code);
}

// ============================================
// SISTEMA DE MULTI-CONTEXTO (Role Switcher)
// ============================================

// Contexto de usuário (um "chapéu" que o usuário pode usar)
export interface UserContext {
  id: string;
  userId: string;
  role: Role;
  tenantId?: string;
  label?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Campos computados para UI
  tenant?: {
    id: string;
    name: string;
    logoUrl?: string;
  };
}

// Resposta do endpoint de troca de contexto
export interface SwitchContextResponse {
  success: boolean;
  activeContext: UserContext;
  newToken?: string;      // Novo JWT com as permissões atualizadas
  menu: any[];            // Menu atualizado para o novo contexto
  permissions: string[];  // Permissões do novo contexto
  error?: string;
}

// Input para troca de contexto
export interface SwitchContextInput {
  targetRole: Role;
  targetTenantId?: string;
}

// Labels para contextos (para exibição no Select)
export function getContextLabel(context: UserContext): string {
  if (context.label) return context.label;

  const roleLabels: Record<Role, string> = {
    SUPER_ADMIN: 'Super Admin',
    TENANT_ADMIN: 'Administrador',
    TENANT_MANAGER: 'Gerente',
    LOCATION_OWNER: 'Parceiro Local',
    ADVERTISER: 'Anunciante',
    OPERATOR: 'Operador',
    SALES_AGENT: 'Vendedor',
  };

  const roleLabel = roleLabels[context.role] || context.role;

  if (context.tenant) {
    return `${roleLabel} - ${context.tenant.name}`;
  }

  return roleLabel;
}

// ============================================
// PLATFORM SETTINGS - Configurações Globais
// ============================================

// ============================================
// RSS FEEDS CONFIGURATION
// ============================================

/**
 * Categorias de feeds RSS
 */
export type RSSFeedCategory =
  | 'geral'
  | 'esporte'
  | 'saude'
  | 'economia'
  | 'tecnologia'
  | 'entretenimento'
  | 'politica'
  | 'mundo';

export const RSS_FEED_CATEGORY_LABELS: Record<RSSFeedCategory, string> = {
  geral: 'Geral',
  esporte: 'Esporte',
  saude: 'Saude',
  economia: 'Economia',
  tecnologia: 'Tecnologia',
  entretenimento: 'Entretenimento',
  politica: 'Politica',
  mundo: 'Mundo',
};

/**
 * Configuracao de um feed RSS individual
 */
export interface RSSFeedConfig {
  id: string;
  name: string;                    // Nome amigavel do feed
  url: string;                     // URL do feed RSS
  category: RSSFeedCategory;       // Categoria do conteudo
  imageTag: string;                // Tag XML para imagem (ex: enclosure, media:content)
  titleTag: string;                // Tag XML para titulo (ex: title)
  descriptionTag: string;          // Tag XML para descricao (ex: description)
  isActive: boolean;               // Se o feed esta ativo
  refreshIntervalMinutes: number;  // Intervalo de atualizacao em minutos
  maxItems: number;                // Maximo de itens a exibir
  createdAt: string;
  updatedAt: string;
}

/**
 * Feeds RSS padrao pre-configurados
 */
export const DEFAULT_RSS_FEEDS: Omit<RSSFeedConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'G1 - Noticias',
    url: 'https://g1.globo.com/rss/g1/',
    category: 'geral',
    imageTag: 'enclosure',
    titleTag: 'title',
    descriptionTag: 'description',
    isActive: true,
    refreshIntervalMinutes: 30,
    maxItems: 10,
  },
  {
    name: 'G1 - Tecnologia',
    url: 'https://g1.globo.com/rss/g1/tecnologia/',
    category: 'tecnologia',
    imageTag: 'enclosure',
    titleTag: 'title',
    descriptionTag: 'description',
    isActive: false,
    refreshIntervalMinutes: 30,
    maxItems: 10,
  },
  {
    name: 'G1 - Economia',
    url: 'https://g1.globo.com/rss/g1/economia/',
    category: 'economia',
    imageTag: 'enclosure',
    titleTag: 'title',
    descriptionTag: 'description',
    isActive: false,
    refreshIntervalMinutes: 30,
    maxItems: 10,
  },
  {
    name: 'GE - Esportes',
    url: 'https://ge.globo.com/rss.xml',
    category: 'esporte',
    imageTag: 'enclosure',
    titleTag: 'title',
    descriptionTag: 'description',
    isActive: false,
    refreshIntervalMinutes: 15,
    maxItems: 10,
  },
];

/**
 * Configurações globais da plataforma
 * Armazenadas no banco e editáveis pelo SUPER_ADMIN
 */
export interface PlatformSettings {
  id: string;

  // Identidade do Sistema
  systemName: string;             // Nome do sistema (default: "BoxPratico")
  systemLogo?: string;            // URL do logo customizado
  supportEmail?: string;          // Email de suporte
  supportPhone?: string;          // Telefone de suporte

  // Comissões de Afiliados (indicação de novos assinantes SaaS)
  affiliateEnabled: boolean;
  affiliateL1Percentage: number;    // Nível 1 (indicação direta) - Ex: 10.0 = 10%
  affiliateL2Percentage: number;    // Nível 2 (indicação indireta) - Ex: 5.0 = 5%
  affiliateLockDays: number;        // Dias antes de liberar saque
  affiliateMinWithdrawal: number;   // Valor mínimo para saque (R$)

  // Comissões de Vendedores (SALES_AGENT)
  salesAgentDefaultCommission: number;  // % padrão sobre contratos fechados
  salesAgentMinCommission: number;      // % mínimo permitido
  salesAgentMaxCommission: number;      // % máximo permitido

  // Comissões de Parceiros de Local (LOCATION_OWNER)
  locationOwnerDefaultCommission: number;  // % padrão de revenue share
  locationOwnerMinCommission: number;      // % mínimo permitido
  locationOwnerMaxCommission: number;      // % máximo permitido

  // Precificação base
  basePricePerPlay: number;         // Preço base por exibição (R$)
  baseSlotDuration: number;         // Duração base do slot em segundos

  // Metadados
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Valores padrão das configurações da plataforma
 * IMPORTANTE: Estes valores são usados como fallback quando não há configuração no banco
 */
export const DEFAULT_PLATFORM_SETTINGS: Omit<PlatformSettings, 'id' | 'updatedAt' | 'updatedBy'> = {
  // Identidade do Sistema
  systemName: 'BoxPratico',
  systemLogo: undefined,
  supportEmail: undefined,
  supportPhone: undefined,

  // Afiliados: 10% nível 1, 5% nível 2 (regra de negócio definitiva)
  affiliateEnabled: true,
  affiliateL1Percentage: 10.0,
  affiliateL2Percentage: 5.0,
  affiliateLockDays: 30,
  affiliateMinWithdrawal: 50.0,

  // Vendedores: 15% padrão, pode variar de 5% a 30%
  salesAgentDefaultCommission: 15.0,
  salesAgentMinCommission: 5.0,
  salesAgentMaxCommission: 30.0,

  // Parceiros de Local: 10% padrão, pode variar de 5% a 50%
  locationOwnerDefaultCommission: 10.0,
  locationOwnerMinCommission: 5.0,
  locationOwnerMaxCommission: 50.0,

  // Precificação base
  basePricePerPlay: 0.10,    // R$ 0,10 por play (slot de 15s)
  baseSlotDuration: 15,       // 15 segundos
};

// ============================================
// PLAY LOG - Registro de Exibições
// ============================================

/**
 * Log de cada exibição de mídia
 * Usado para calcular proof-of-play e revenue share
 */
export interface PlayLog {
  id: string;

  // Identificadores
  tenantId: string;
  terminalId: string;         // Monitor/tela que exibiu
  locationId?: string;        // Ponto onde está o terminal

  // Mídia exibida
  mediaItemId: string;
  campaignId?: string;        // Campanha associada (se houver)
  advertiserId?: string;      // Anunciante dono da mídia

  // Detalhes da exibição
  playedAt: string;           // Timestamp da exibição
  durationSeconds: number;    // Duração real exibida
  slotDurationSeconds: number; // Duração contratada do slot

  // Valor financeiro (calculado no momento da exibição)
  valuePerPlay: number;       // Valor unitário deste play (R$)

  // Metadados
  terminalStatus?: 'ONLINE' | 'OFFLINE';
  playlistId?: string;

  createdAt: string;
}

/**
 * Agregação de PlayLogs por período
 */
export interface PlayLogSummary {
  tenantId: string;
  terminalId: string;
  locationId?: string;
  campaignId?: string;
  advertiserId?: string;

  period: string;             // Ex: "2024-01" (YYYY-MM)
  totalPlays: number;
  totalDurationSeconds: number;
  totalValue: number;         // Soma dos valuePerPlay
}

// ============================================
// SETTLEMENT - Fechamento Financeiro
// ============================================

export type SettlementStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';

export const SETTLEMENT_STATUS_LABELS: Record<SettlementStatus, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
};

export const SETTLEMENT_STATUS_COLORS: Record<SettlementStatus, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPROVED: { bg: 'bg-blue-100', text: 'text-blue-700' },
  PAID: { bg: 'bg-green-100', text: 'text-green-700' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

export type SettlementType = 'LOCATION_OWNER' | 'SALES_AGENT';

/**
 * Registro de fechamento financeiro mensal
 * Gerado pelo SettlementService
 */
export interface Settlement {
  id: string;

  // Identificadores
  tenantId: string;
  type: SettlementType;       // Tipo de beneficiário
  beneficiaryId: string;      // ID do parceiro ou vendedor
  beneficiaryName: string;    // Nome para exibição
  beneficiaryEmail?: string;

  // Período
  referenceMonth: string;     // Ex: "2024-01" (YYYY-MM)
  periodStart: string;        // Data início do período
  periodEnd: string;          // Data fim do período

  // Valores calculados
  grossValue: number;         // Valor bruto gerado (campanhas no terminal ou contratos)
  commissionRate: number;     // Taxa aplicada (%)
  netValue: number;           // Valor líquido a pagar (grossValue * commissionRate / 100)

  // Detalhamento
  totalPlays?: number;        // Total de exibições (para LOCATION_OWNER)
  totalContracts?: number;    // Total de contratos (para SALES_AGENT)
  details?: SettlementDetail[];

  // Status e pagamento
  status: SettlementStatus;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paidBy?: string;
  paymentMethod?: string;
  paymentReference?: string;  // ID da transação

  // Metadados
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Detalhamento do settlement (linha por campanha/contrato)
 */
export interface SettlementDetail {
  id: string;
  settlementId: string;

  // Referência
  campaignId?: string;
  campaignName?: string;
  contractId?: string;
  contractName?: string;
  advertiserId?: string;
  advertiserName?: string;

  // Valores
  grossValue: number;
  commissionRate: number;
  netValue: number;

  // Para LOCATION_OWNER
  totalPlays?: number;
  totalDurationSeconds?: number;

  // Para SALES_AGENT
  contractValue?: number;
}

/**
 * Input para gerar settlements de um período
 */
export interface GenerateSettlementsInput {
  tenantId: string;
  referenceMonth: string;     // YYYY-MM
  type: SettlementType;
  dryRun?: boolean;           // Se true, não salva, apenas calcula
}

/**
 * Resultado da geração de settlements
 */
export interface GenerateSettlementsResult {
  success: boolean;
  settlements: Settlement[];
  totalGrossValue: number;
  totalNetValue: number;
  beneficiariesCount: number;
  errors?: string[];
}

// ============================================
// SALES AGENT QUOTE - Comissão no Simulador
// ============================================

/**
 * Resultado do cálculo de orçamento com comissão do vendedor
 */
export interface QuoteWithCommission {
  // Dados do orçamento
  totalPrice: number;
  pricePerTerminal: Array<{
    id: string;
    name: string;
    tier: TerminalTier;
    price: number;
  }>;
  audience: {
    dailyImpressions: number;
    uniqueViewers: number;
    totalImpressions: number;
  };
  summary: {
    terminals: number;
    totalPlays: number;
    avgPricePerPlay: number;
    durationDays: number;
    slotDurationSec: number;
  };

  // Comissão do vendedor (calculada em tempo real)
  salesAgentCommission: {
    rate: number;              // Taxa aplicada (%)
    estimatedValue: number;    // Valor estimado da comissão
    perDay: number;            // Comissão por dia de campanha
    note: string;              // Ex: "Baseado em 15% sobre R$ 10.000"
  };

  // Multiplicador de tempo (importante para vendas)
  timeMultiplier: {
    factor: number;            // Ex: 2.0 para slot de 30s (base 15s)
    explanation: string;       // Ex: "Slot de 30s = 2x o valor base"
  };
}

/**
 * Calcula o multiplicador de tempo baseado na duração do slot
 */
export function calculateTimeMultiplier(slotDurationSec: number, baseDuration: number = 15): number {
  return slotDurationSec / baseDuration;
}

/**
 * Calcula o valor por play considerando duração
 */
export function calculateValuePerPlay(
  basePricePerPlay: number,
  slotDurationSec: number,
  tierMultiplier: number,
  baseDuration: number = 15
): number {
  const timeMultiplier = calculateTimeMultiplier(slotDurationSec, baseDuration);
  return basePricePerPlay * timeMultiplier * tierMultiplier;
}

