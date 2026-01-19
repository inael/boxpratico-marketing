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
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'image' | 'video' | 'youtube' | 'pdf' | 'news' | 'rtmp';

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

export interface Monitor {
  id: string;
  name: string;
  slug: string;
  location: string;
  condominiumId: string;
  isActive: boolean;
  lastHeartbeat?: string;
  isOnline?: boolean;
  // Orientação da tela (horizontal = paisagem, vertical = retrato)
  orientation?: ScreenOrientation;
  // Horário de funcionamento
  operatingSchedule?: {
    is24h: boolean; // Se true, funciona 24h
    startTime?: string; // Formato "HH:mm" - horário de ligar
    endTime?: string; // Formato "HH:mm" - horário de desligar
    // Dias da semana (0=Dom, 1=Seg, ..., 6=Sáb)
    daysOfWeek?: number[]; // Ex: [1,2,3,4,5] = Seg a Sex
  };
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

