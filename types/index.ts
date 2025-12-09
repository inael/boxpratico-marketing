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
  condominiumId: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  condominiumId: string;
  monitorId?: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  showNews?: boolean;
  newsEveryNMedia?: number;
  newsDurationSeconds?: number;
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

export interface Monitor {
  id: string;
  name: string;
  slug: string;
  location: string;
  condominiumId: string;
  isActive: boolean;
  lastHeartbeat?: string;
  isOnline?: boolean;
  createdAt: string;
  updatedAt: string;
}

