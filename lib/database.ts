import { promises as fs } from 'fs';
import path from 'path';
import {
  isRedisConfigured,
  getEntity,
  getAllEntities,
  setEntity,
  deleteEntity,
  addToIndex,
  removeFromIndex,
  getFromIndex,
  setSlugMapping,
  getIdBySlug,
  deleteSlugMapping,
} from './redis';
import {
  Condominium,
  Campaign,
  Monitor,
  MediaItem,
} from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists for JSON fallback
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generic JSON file operations
async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

// ============================================
// CONDOMINIUMS
// ============================================

export async function getCondominiums(): Promise<Condominium[]> {
  if (isRedisConfigured()) {
    return getAllEntities<Condominium>('condominiums');
  }
  return readJsonFile<Condominium>('condominiums.json');
}

export async function getCondominiumById(id: string): Promise<Condominium | null> {
  if (isRedisConfigured()) {
    return getEntity<Condominium>('condominiums', id);
  }
  const condominiums = await readJsonFile<Condominium>('condominiums.json');
  return condominiums.find(c => c.id === id) || null;
}

export async function getCondominiumBySlug(slug: string): Promise<Condominium | null> {
  if (isRedisConfigured()) {
    const id = await getIdBySlug('condominiums', slug);
    if (!id) return null;
    return getEntity<Condominium>('condominiums', id);
  }
  const condominiums = await readJsonFile<Condominium>('condominiums.json');
  return condominiums.find(c => c.slug === slug) || null;
}

export async function createCondominium(data: Omit<Condominium, 'id' | 'createdAt' | 'updatedAt'>): Promise<Condominium> {
  const condominium: Condominium = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('condominiums', condominium.id, condominium);
    await setSlugMapping('condominiums', condominium.slug, condominium.id);
  } else {
    const condominiums = await readJsonFile<Condominium>('condominiums.json');
    condominiums.push(condominium);
    await writeJsonFile('condominiums.json', condominiums);
  }

  return condominium;
}

export async function updateCondominium(id: string, updates: Partial<Condominium>): Promise<Condominium | null> {
  const existing = await getCondominiumById(id);
  if (!existing) return null;

  const updated: Condominium = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update slug mapping if changed
    if (updates.slug && updates.slug !== existing.slug) {
      await deleteSlugMapping('condominiums', existing.slug);
      await setSlugMapping('condominiums', updates.slug, id);
    }
    await setEntity('condominiums', id, updated);
  } else {
    const condominiums = await readJsonFile<Condominium>('condominiums.json');
    const index = condominiums.findIndex(c => c.id === id);
    if (index !== -1) {
      condominiums[index] = updated;
      await writeJsonFile('condominiums.json', condominiums);
    }
  }

  return updated;
}

export async function deleteCondominium(id: string): Promise<boolean> {
  const existing = await getCondominiumById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await deleteSlugMapping('condominiums', existing.slug);
    await deleteEntity('condominiums', id);
  } else {
    const condominiums = await readJsonFile<Condominium>('condominiums.json');
    const filtered = condominiums.filter(c => c.id !== id);
    await writeJsonFile('condominiums.json', filtered);
  }

  return true;
}

// ============================================
// CAMPAIGNS
// ============================================

export async function getCampaigns(): Promise<Campaign[]> {
  if (isRedisConfigured()) {
    return getAllEntities<Campaign>('campaigns');
  }
  return readJsonFile<Campaign>('campaigns.json');
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  if (isRedisConfigured()) {
    return getEntity<Campaign>('campaigns', id);
  }
  const campaigns = await readJsonFile<Campaign>('campaigns.json');
  return campaigns.find(c => c.id === id) || null;
}

export async function getCampaignsByCondominiumId(condominiumId: string): Promise<Campaign[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`campaigns:byCondominium:${condominiumId}`);
    if (ids.length === 0) return [];
    const campaigns = await Promise.all(ids.map(id => getEntity<Campaign>('campaigns', id)));
    return campaigns.filter((c): c is Campaign => c !== null);
  }
  const campaigns = await readJsonFile<Campaign>('campaigns.json');
  return campaigns.filter(c => c.condominiumId === condominiumId);
}

export async function createCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<Campaign> {
  const campaign: Campaign = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('campaigns', campaign.id, campaign);
    await addToIndex(`campaigns:byCondominium:${campaign.condominiumId}`, campaign.id);
    if (campaign.monitorId) {
      await addToIndex(`campaigns:byMonitor:${campaign.monitorId}`, campaign.id);
    }
  } else {
    const campaigns = await readJsonFile<Campaign>('campaigns.json');
    campaigns.push(campaign);
    await writeJsonFile('campaigns.json', campaigns);
  }

  return campaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  const existing = await getCampaignById(id);
  if (!existing) return null;

  const updated: Campaign = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update monitor index if changed
    if (updates.monitorId !== undefined && updates.monitorId !== existing.monitorId) {
      if (existing.monitorId) {
        await removeFromIndex(`campaigns:byMonitor:${existing.monitorId}`, id);
      }
      if (updates.monitorId) {
        await addToIndex(`campaigns:byMonitor:${updates.monitorId}`, id);
      }
    }
    await setEntity('campaigns', id, updated);
  } else {
    const campaigns = await readJsonFile<Campaign>('campaigns.json');
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index] = updated;
      await writeJsonFile('campaigns.json', campaigns);
    }
  }

  return updated;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const existing = await getCampaignById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await removeFromIndex(`campaigns:byCondominium:${existing.condominiumId}`, id);
    if (existing.monitorId) {
      await removeFromIndex(`campaigns:byMonitor:${existing.monitorId}`, id);
    }
    await deleteEntity('campaigns', id);
  } else {
    const campaigns = await readJsonFile<Campaign>('campaigns.json');
    const filtered = campaigns.filter(c => c.id !== id);
    await writeJsonFile('campaigns.json', filtered);
  }

  return true;
}

// ============================================
// MONITORS
// ============================================

export async function getMonitors(): Promise<Monitor[]> {
  if (isRedisConfigured()) {
    return getAllEntities<Monitor>('monitors');
  }
  return readJsonFile<Monitor>('monitors.json');
}

export async function getMonitorById(id: string): Promise<Monitor | null> {
  if (isRedisConfigured()) {
    return getEntity<Monitor>('monitors', id);
  }
  const monitors = await readJsonFile<Monitor>('monitors.json');
  return monitors.find(m => m.id === id) || null;
}

export async function getMonitorBySlug(slug: string): Promise<Monitor | null> {
  if (isRedisConfigured()) {
    const id = await getIdBySlug('monitors', slug);
    if (!id) return null;
    return getEntity<Monitor>('monitors', id);
  }
  const monitors = await readJsonFile<Monitor>('monitors.json');
  return monitors.find(m => m.slug === slug) || null;
}

export async function getMonitorsByCondominiumId(condominiumId: string): Promise<Monitor[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`monitors:byCondominium:${condominiumId}`);
    if (ids.length === 0) return [];
    const monitors = await Promise.all(ids.map(id => getEntity<Monitor>('monitors', id)));
    return monitors.filter((m): m is Monitor => m !== null);
  }
  const monitors = await readJsonFile<Monitor>('monitors.json');
  return monitors.filter(m => m.condominiumId === condominiumId);
}

export async function createMonitor(data: Omit<Monitor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Monitor> {
  const monitor: Monitor = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('monitors', monitor.id, monitor);
    await setSlugMapping('monitors', monitor.slug, monitor.id);
    await addToIndex(`monitors:byCondominium:${monitor.condominiumId}`, monitor.id);
  } else {
    const monitors = await readJsonFile<Monitor>('monitors.json');
    monitors.push(monitor);
    await writeJsonFile('monitors.json', monitors);
  }

  return monitor;
}

export async function updateMonitor(id: string, updates: Partial<Monitor>): Promise<Monitor | null> {
  const existing = await getMonitorById(id);
  if (!existing) return null;

  const updated: Monitor = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update slug mapping if changed
    if (updates.slug && updates.slug !== existing.slug) {
      await deleteSlugMapping('monitors', existing.slug);
      await setSlugMapping('monitors', updates.slug, id);
    }
    await setEntity('monitors', id, updated);
  } else {
    const monitors = await readJsonFile<Monitor>('monitors.json');
    const index = monitors.findIndex(m => m.id === id);
    if (index !== -1) {
      monitors[index] = updated;
      await writeJsonFile('monitors.json', monitors);
    }
  }

  return updated;
}

export async function deleteMonitor(id: string): Promise<boolean> {
  const existing = await getMonitorById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await deleteSlugMapping('monitors', existing.slug);
    await removeFromIndex(`monitors:byCondominium:${existing.condominiumId}`, id);
    await deleteEntity('monitors', id);
  } else {
    const monitors = await readJsonFile<Monitor>('monitors.json');
    const filtered = monitors.filter(m => m.id !== id);
    await writeJsonFile('monitors.json', filtered);
  }

  return true;
}

// ============================================
// MEDIA ITEMS
// ============================================

export async function getMediaItems(): Promise<MediaItem[]> {
  if (isRedisConfigured()) {
    return getAllEntities<MediaItem>('media-items');
  }
  return readJsonFile<MediaItem>('media-items.json');
}

export async function getMediaItemById(id: string): Promise<MediaItem | null> {
  if (isRedisConfigured()) {
    return getEntity<MediaItem>('media-items', id);
  }
  const items = await readJsonFile<MediaItem>('media-items.json');
  return items.find(i => i.id === id) || null;
}

export async function getMediaItemsByCondominiumId(condominiumId: string): Promise<MediaItem[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`media-items:byCondominium:${condominiumId}`);
    if (ids.length === 0) return [];
    const items = await Promise.all(ids.map(id => getEntity<MediaItem>('media-items', id)));
    return items.filter((i): i is MediaItem => i !== null);
  }
  const items = await readJsonFile<MediaItem>('media-items.json');
  return items.filter(i => i.condominiumId === condominiumId);
}

export async function getMediaItemsByCampaignId(campaignId: string): Promise<MediaItem[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`media-items:byCampaign:${campaignId}`);
    if (ids.length === 0) return [];
    const items = await Promise.all(ids.map(id => getEntity<MediaItem>('media-items', id)));
    return items.filter((i): i is MediaItem => i !== null);
  }
  const items = await readJsonFile<MediaItem>('media-items.json');
  return items.filter(i => i.campaignId === campaignId);
}

export async function createMediaItem(data: Omit<MediaItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaItem> {
  const item: MediaItem = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('media-items', item.id, item);
    await addToIndex(`media-items:byCondominium:${item.condominiumId}`, item.id);
    if (item.campaignId) {
      await addToIndex(`media-items:byCampaign:${item.campaignId}`, item.id);
    }
  } else {
    const items = await readJsonFile<MediaItem>('media-items.json');
    items.push(item);
    await writeJsonFile('media-items.json', items);
  }

  return item;
}

export async function updateMediaItem(id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> {
  const existing = await getMediaItemById(id);
  if (!existing) return null;

  const updated: MediaItem = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update campaign index if changed
    if (updates.campaignId !== undefined && updates.campaignId !== existing.campaignId) {
      if (existing.campaignId) {
        await removeFromIndex(`media-items:byCampaign:${existing.campaignId}`, id);
      }
      if (updates.campaignId) {
        await addToIndex(`media-items:byCampaign:${updates.campaignId}`, id);
      }
    }
    await setEntity('media-items', id, updated);
  } else {
    const items = await readJsonFile<MediaItem>('media-items.json');
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = updated;
      await writeJsonFile('media-items.json', items);
    }
  }

  return updated;
}

export async function deleteMediaItem(id: string): Promise<boolean> {
  const existing = await getMediaItemById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await removeFromIndex(`media-items:byCondominium:${existing.condominiumId}`, id);
    if (existing.campaignId) {
      await removeFromIndex(`media-items:byCampaign:${existing.campaignId}`, id);
    }
    await deleteEntity('media-items', id);
  } else {
    const items = await readJsonFile<MediaItem>('media-items.json');
    const filtered = items.filter(i => i.id !== id);
    await writeJsonFile('media-items.json', filtered);
  }

  return true;
}

// NOTE: News items are fetched directly from RSS feed in the API route
// No database persistence is needed for news
