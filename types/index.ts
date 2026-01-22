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

  // Metricas de audiencia
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

// Tipo de usuario
export type UserRole = 'admin' | 'operator' | 'viewer';

// Provedor de autenticação
export type AuthProvider = 'credentials' | 'google';

// Usuario do sistema
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string;

  // Autenticação OAuth
  provider?: AuthProvider;
  providerId?: string; // ID do usuário no Google/etc
  emailVerified?: boolean;

  // Conta vinculada (multi-tenant)
  accountId?: string;

  // Permissoes
  role: UserRole;
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
  // Locais
  | 'condominiums:read'
  | 'condominiums:create'
  | 'condominiums:update'
  | 'condominiums:delete'
  // Monitores
  | 'monitors:read'
  | 'monitors:create'
  | 'monitors:update'
  | 'monitors:delete'
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
  // Playlists/Campanhas
  | 'campaigns:read'
  | 'campaigns:create'
  | 'campaigns:update'
  | 'campaigns:delete'
  // Usuários
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  // Contas
  | 'accounts:read'
  | 'accounts:create'
  | 'accounts:update'
  | 'accounts:delete'
  // Contratos
  | 'contracts:read'
  | 'contracts:create'
  | 'contracts:update'
  | 'contracts:delete'
  // Configurações
  | 'settings:read'
  | 'settings:update'
  // Relatórios
  | 'reports:read'
  | 'analytics:read';

// Permissões por role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'condominiums:read', 'condominiums:create', 'condominiums:update', 'condominiums:delete',
    'monitors:read', 'monitors:create', 'monitors:update', 'monitors:delete',
    'advertisers:read', 'advertisers:create', 'advertisers:update', 'advertisers:delete',
    'media:read', 'media:create', 'media:update', 'media:delete',
    'campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete',
    'users:read', 'users:create', 'users:update', 'users:delete',
    'accounts:read', 'accounts:create', 'accounts:update', 'accounts:delete',
    'contracts:read', 'contracts:create', 'contracts:update', 'contracts:delete',
    'settings:read', 'settings:update',
    'reports:read', 'analytics:read',
  ],
  operator: [
    'condominiums:read', 'condominiums:create', 'condominiums:update',
    'monitors:read', 'monitors:create', 'monitors:update',
    'advertisers:read', 'advertisers:create', 'advertisers:update',
    'media:read', 'media:create', 'media:update',
    'campaigns:read', 'campaigns:create', 'campaigns:update',
    'users:read',
    'contracts:read', 'contracts:create', 'contracts:update',
    'reports:read', 'analytics:read',
  ],
  viewer: [
    'condominiums:read',
    'monitors:read',
    'advertisers:read',
    'media:read',
    'campaigns:read',
    'reports:read',
  ],
};

// Verificar se usuário tem permissão
export function hasPermission(user: User, permission: Permission): boolean {
  if (user.isAdmin) return true;
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
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

// Labels para roles
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

  // Relacionamentos
  condominiumId?: string;  // Para contratos de cessão de espaço
  advertiserId?: string;   // Para contratos de publicidade

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

