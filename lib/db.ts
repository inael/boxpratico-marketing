import fs from 'fs';
import path from 'path';
import { Condominium, MediaItem } from '@/types';

const DB_DIR = path.join(process.cwd(), 'data');
const CONDOMINIUMS_FILE = path.join(DB_DIR, 'condominiums.json');
const MEDIA_ITEMS_FILE = path.join(DB_DIR, 'media-items.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize files if they don't exist
if (!fs.existsSync(CONDOMINIUMS_FILE)) {
  fs.writeFileSync(CONDOMINIUMS_FILE, JSON.stringify([], null, 2));
}

if (!fs.existsSync(MEDIA_ITEMS_FILE)) {
  fs.writeFileSync(MEDIA_ITEMS_FILE, JSON.stringify([], null, 2));
}

// Condominium operations
export function getCondominiums(): Condominium[] {
  const data = fs.readFileSync(CONDOMINIUMS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function getCondominiumById(id: string): Condominium | undefined {
  const condominiums = getCondominiums();
  return condominiums.find(c => c.id === id);
}

export function getCondominiumBySlug(slug: string): Condominium | undefined {
  const condominiums = getCondominiums();
  return condominiums.find(c => c.slug === slug);
}

export function createCondominium(condominium: Omit<Condominium, 'id' | 'createdAt' | 'updatedAt'>): Condominium {
  const condominiums = getCondominiums();
  const newCondominium: Condominium = {
    ...condominium,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  condominiums.push(newCondominium);
  fs.writeFileSync(CONDOMINIUMS_FILE, JSON.stringify(condominiums, null, 2));
  return newCondominium;
}

export function updateCondominium(id: string, updates: Partial<Omit<Condominium, 'id' | 'createdAt'>>): Condominium | null {
  const condominiums = getCondominiums();
  const index = condominiums.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  condominiums[index] = {
    ...condominiums[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(CONDOMINIUMS_FILE, JSON.stringify(condominiums, null, 2));
  return condominiums[index];
}

export function deleteCondominium(id: string): boolean {
  const condominiums = getCondominiums();
  const filtered = condominiums.filter(c => c.id !== id);
  
  if (filtered.length === condominiums.length) return false;
  
  // Also delete all media items for this condominium
  const mediaItems = getMediaItems();
  const filteredMedia = mediaItems.filter(m => m.condominiumId !== id);
  fs.writeFileSync(MEDIA_ITEMS_FILE, JSON.stringify(filteredMedia, null, 2));
  
  fs.writeFileSync(CONDOMINIUMS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}

// Media Item operations
export function getMediaItems(): MediaItem[] {
  const data = fs.readFileSync(MEDIA_ITEMS_FILE, 'utf-8');
  return JSON.parse(data);
}

export function getMediaItemsByCondominiumId(condominiumId: string): MediaItem[] {
  const mediaItems = getMediaItems();
  return mediaItems
    .filter(m => m.condominiumId === condominiumId && m.isActive)
    .sort((a, b) => a.order - b.order);
}

export function getMediaItemById(id: string): MediaItem | undefined {
  const mediaItems = getMediaItems();
  return mediaItems.find(m => m.id === id);
}

export function createMediaItem(mediaItem: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): MediaItem {
  const mediaItems = getMediaItems();
  const newMediaItem: MediaItem = {
    ...mediaItem,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mediaItems.push(newMediaItem);
  fs.writeFileSync(MEDIA_ITEMS_FILE, JSON.stringify(mediaItems, null, 2));
  return newMediaItem;
}

export function updateMediaItem(id: string, updates: Partial<Omit<MediaItem, 'id' | 'createdAt'>>): MediaItem | null {
  const mediaItems = getMediaItems();
  const index = mediaItems.findIndex(m => m.id === id);
  
  if (index === -1) return null;
  
  mediaItems[index] = {
    ...mediaItems[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(MEDIA_ITEMS_FILE, JSON.stringify(mediaItems, null, 2));
  return mediaItems[index];
}

export function deleteMediaItem(id: string): boolean {
  const mediaItems = getMediaItems();
  const filtered = mediaItems.filter(m => m.id !== id);
  
  if (filtered.length === mediaItems.length) return false;
  
  fs.writeFileSync(MEDIA_ITEMS_FILE, JSON.stringify(filtered, null, 2));
  return true;
}
