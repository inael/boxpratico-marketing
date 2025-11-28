export interface Condominium {
  id: string;
  name: string;
  slug: string;
  cnpj?: string;
  address?: string;
  isActive?: boolean;
  showNews?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'image' | 'video' | 'youtube' | 'pdf' | 'news';

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  type: MediaType;
  sourceUrl: string;
  durationSeconds?: number;
  isActive: boolean;
  order: number;
  condominiumId: string;
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
