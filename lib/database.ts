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
  Advertiser,
  Contract,
  User,
  MediaGroup,
  LibraryItem,
  LibraryFolder,
  RemoteCommand,
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

// ============================================
// ADVERTISERS (Anunciantes)
// ============================================

export async function getAdvertisers(): Promise<Advertiser[]> {
  if (isRedisConfigured()) {
    return getAllEntities<Advertiser>('advertisers');
  }
  return readJsonFile<Advertiser>('advertisers.json');
}

export async function getAdvertiserById(id: string): Promise<Advertiser | null> {
  if (isRedisConfigured()) {
    return getEntity<Advertiser>('advertisers', id);
  }
  const advertisers = await readJsonFile<Advertiser>('advertisers.json');
  return advertisers.find(a => a.id === id) || null;
}

export async function getAdvertiserBySlug(slug: string): Promise<Advertiser | null> {
  if (isRedisConfigured()) {
    const id = await getIdBySlug('advertisers', slug);
    if (!id) return null;
    return getEntity<Advertiser>('advertisers', id);
  }
  const advertisers = await readJsonFile<Advertiser>('advertisers.json');
  return advertisers.find(a => a.slug === slug) || null;
}

export async function createAdvertiser(data: Omit<Advertiser, 'id' | 'createdAt' | 'updatedAt'>): Promise<Advertiser> {
  const advertiser: Advertiser = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('advertisers', advertiser.id, advertiser);
    await setSlugMapping('advertisers', advertiser.slug, advertiser.id);
  } else {
    const advertisers = await readJsonFile<Advertiser>('advertisers.json');
    advertisers.push(advertiser);
    await writeJsonFile('advertisers.json', advertisers);
  }

  return advertiser;
}

export async function updateAdvertiser(id: string, updates: Partial<Advertiser>): Promise<Advertiser | null> {
  const existing = await getAdvertiserById(id);
  if (!existing) return null;

  const updated: Advertiser = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update slug mapping if changed
    if (updates.slug && updates.slug !== existing.slug) {
      await deleteSlugMapping('advertisers', existing.slug);
      await setSlugMapping('advertisers', updates.slug, id);
    }
    await setEntity('advertisers', id, updated);
  } else {
    const advertisers = await readJsonFile<Advertiser>('advertisers.json');
    const index = advertisers.findIndex(a => a.id === id);
    if (index !== -1) {
      advertisers[index] = updated;
      await writeJsonFile('advertisers.json', advertisers);
    }
  }

  return updated;
}

export async function deleteAdvertiser(id: string): Promise<boolean> {
  const existing = await getAdvertiserById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await deleteSlugMapping('advertisers', existing.slug);
    await deleteEntity('advertisers', id);
  } else {
    const advertisers = await readJsonFile<Advertiser>('advertisers.json');
    const filtered = advertisers.filter(a => a.id !== id);
    await writeJsonFile('advertisers.json', filtered);
  }

  return true;
}

// ============================================
// CONTRACTS (Contratos)
// ============================================

export async function getContracts(): Promise<Contract[]> {
  if (isRedisConfigured()) {
    return getAllEntities<Contract>('contracts');
  }
  return readJsonFile<Contract>('contracts.json');
}

export async function getContractById(id: string): Promise<Contract | null> {
  if (isRedisConfigured()) {
    return getEntity<Contract>('contracts', id);
  }
  const contracts = await readJsonFile<Contract>('contracts.json');
  return contracts.find(c => c.id === id) || null;
}

export async function getContractsByCondominiumId(condominiumId: string): Promise<Contract[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`contracts:byCondominium:${condominiumId}`);
    if (ids.length === 0) return [];
    const contracts = await Promise.all(ids.map(id => getEntity<Contract>('contracts', id)));
    return contracts.filter((c): c is Contract => c !== null);
  }
  const contracts = await readJsonFile<Contract>('contracts.json');
  return contracts.filter(c => c.condominiumId === condominiumId);
}

export async function getContractsByAdvertiserId(advertiserId: string): Promise<Contract[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`contracts:byAdvertiser:${advertiserId}`);
    if (ids.length === 0) return [];
    const contracts = await Promise.all(ids.map(id => getEntity<Contract>('contracts', id)));
    return contracts.filter((c): c is Contract => c !== null);
  }
  const contracts = await readJsonFile<Contract>('contracts.json');
  return contracts.filter(c => c.advertiserId === advertiserId);
}

export async function createContract(data: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contract> {
  const contract: Contract = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('contracts', contract.id, contract);
    if (contract.condominiumId) {
      await addToIndex(`contracts:byCondominium:${contract.condominiumId}`, contract.id);
    }
    if (contract.advertiserId) {
      await addToIndex(`contracts:byAdvertiser:${contract.advertiserId}`, contract.id);
    }
    await addToIndex(`contracts:byType:${contract.type}`, contract.id);
    await addToIndex(`contracts:byStatus:${contract.status}`, contract.id);
  } else {
    const contracts = await readJsonFile<Contract>('contracts.json');
    contracts.push(contract);
    await writeJsonFile('contracts.json', contracts);
  }

  return contract;
}

export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract | null> {
  const existing = await getContractById(id);
  if (!existing) return null;

  const updated: Contract = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update status index if changed
    if (updates.status && updates.status !== existing.status) {
      await removeFromIndex(`contracts:byStatus:${existing.status}`, id);
      await addToIndex(`contracts:byStatus:${updates.status}`, id);
    }
    await setEntity('contracts', id, updated);
  } else {
    const contracts = await readJsonFile<Contract>('contracts.json');
    const index = contracts.findIndex(c => c.id === id);
    if (index !== -1) {
      contracts[index] = updated;
      await writeJsonFile('contracts.json', contracts);
    }
  }

  return updated;
}

export async function deleteContract(id: string): Promise<boolean> {
  const existing = await getContractById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    if (existing.condominiumId) {
      await removeFromIndex(`contracts:byCondominium:${existing.condominiumId}`, id);
    }
    if (existing.advertiserId) {
      await removeFromIndex(`contracts:byAdvertiser:${existing.advertiserId}`, id);
    }
    await removeFromIndex(`contracts:byType:${existing.type}`, id);
    await removeFromIndex(`contracts:byStatus:${existing.status}`, id);
    await deleteEntity('contracts', id);
  } else {
    const contracts = await readJsonFile<Contract>('contracts.json');
    const filtered = contracts.filter(c => c.id !== id);
    await writeJsonFile('contracts.json', filtered);
  }

  return true;
}

// ============================================
// USERS (Usuarios)
// ============================================

export async function getUsers(): Promise<User[]> {
  if (isRedisConfigured()) {
    return getAllEntities<User>('users');
  }
  return readJsonFile<User>('users.json');
}

export async function getUserById(id: string): Promise<User | null> {
  if (isRedisConfigured()) {
    return getEntity<User>('users', id);
  }
  const users = await readJsonFile<User>('users.json');
  return users.find(u => u.id === id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const user: User = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('users', user.id, user);
    await addToIndex(`users:byEmail:${user.email.toLowerCase()}`, user.id);
    await addToIndex(`users:byRole:${user.role}`, user.id);
  } else {
    const users = await readJsonFile<User>('users.json');
    users.push(user);
    await writeJsonFile('users.json', users);
  }

  return user;
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  const updated: User = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    if (updates.email && updates.email !== existing.email) {
      await removeFromIndex(`users:byEmail:${existing.email.toLowerCase()}`, id);
      await addToIndex(`users:byEmail:${updates.email.toLowerCase()}`, id);
    }
    if (updates.role && updates.role !== existing.role) {
      await removeFromIndex(`users:byRole:${existing.role}`, id);
      await addToIndex(`users:byRole:${updates.role}`, id);
    }
    await setEntity('users', id, updated);
  } else {
    const users = await readJsonFile<User>('users.json');
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = updated;
      await writeJsonFile('users.json', users);
    }
  }

  return updated;
}

export async function deleteUser(id: string): Promise<boolean> {
  const existing = await getUserById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await removeFromIndex(`users:byEmail:${existing.email.toLowerCase()}`, id);
    await removeFromIndex(`users:byRole:${existing.role}`, id);
    await deleteEntity('users', id);
  } else {
    const users = await readJsonFile<User>('users.json');
    const filtered = users.filter(u => u.id !== id);
    await writeJsonFile('users.json', filtered);
  }

  return true;
}

// ============================================
// MEDIA GROUPS (Grupos de Midias)
// ============================================

export async function getMediaGroups(): Promise<MediaGroup[]> {
  if (isRedisConfigured()) {
    return getAllEntities<MediaGroup>('media-groups');
  }
  return readJsonFile<MediaGroup>('media-groups.json');
}

export async function getMediaGroupById(id: string): Promise<MediaGroup | null> {
  if (isRedisConfigured()) {
    return getEntity<MediaGroup>('media-groups', id);
  }
  const groups = await readJsonFile<MediaGroup>('media-groups.json');
  return groups.find(g => g.id === id) || null;
}

export async function getMediaGroupBySlug(slug: string): Promise<MediaGroup | null> {
  if (isRedisConfigured()) {
    const id = await getIdBySlug('media-groups', slug);
    if (!id) return null;
    return getEntity<MediaGroup>('media-groups', id);
  }
  const groups = await readJsonFile<MediaGroup>('media-groups.json');
  return groups.find(g => g.slug === slug) || null;
}

export async function getMediaGroupsByAdvertiserId(advertiserId: string): Promise<MediaGroup[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`media-groups:byAdvertiser:${advertiserId}`);
    if (ids.length === 0) return [];
    const groups = await Promise.all(ids.map(id => getEntity<MediaGroup>('media-groups', id)));
    return groups.filter((g): g is MediaGroup => g !== null);
  }
  const groups = await readJsonFile<MediaGroup>('media-groups.json');
  return groups.filter(g => g.advertiserId === advertiserId);
}

export async function createMediaGroup(data: Omit<MediaGroup, 'id' | 'createdAt' | 'updatedAt'>): Promise<MediaGroup> {
  const group: MediaGroup = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('media-groups', group.id, group);
    await setSlugMapping('media-groups', group.slug, group.id);
    if (group.advertiserId) {
      await addToIndex(`media-groups:byAdvertiser:${group.advertiserId}`, group.id);
    }
  } else {
    const groups = await readJsonFile<MediaGroup>('media-groups.json');
    groups.push(group);
    await writeJsonFile('media-groups.json', groups);
  }

  return group;
}

export async function updateMediaGroup(id: string, updates: Partial<MediaGroup>): Promise<MediaGroup | null> {
  const existing = await getMediaGroupById(id);
  if (!existing) return null;

  const updated: MediaGroup = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update slug mapping if changed
    if (updates.slug && updates.slug !== existing.slug) {
      await deleteSlugMapping('media-groups', existing.slug);
      await setSlugMapping('media-groups', updates.slug, id);
    }
    // Update advertiser index if changed
    if (updates.advertiserId !== undefined && updates.advertiserId !== existing.advertiserId) {
      if (existing.advertiserId) {
        await removeFromIndex(`media-groups:byAdvertiser:${existing.advertiserId}`, id);
      }
      if (updates.advertiserId) {
        await addToIndex(`media-groups:byAdvertiser:${updates.advertiserId}`, id);
      }
    }
    await setEntity('media-groups', id, updated);
  } else {
    const groups = await readJsonFile<MediaGroup>('media-groups.json');
    const index = groups.findIndex(g => g.id === id);
    if (index !== -1) {
      groups[index] = updated;
      await writeJsonFile('media-groups.json', groups);
    }
  }

  return updated;
}

export async function deleteMediaGroup(id: string): Promise<boolean> {
  const existing = await getMediaGroupById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await deleteSlugMapping('media-groups', existing.slug);
    if (existing.advertiserId) {
      await removeFromIndex(`media-groups:byAdvertiser:${existing.advertiserId}`, id);
    }
    await deleteEntity('media-groups', id);
  } else {
    const groups = await readJsonFile<MediaGroup>('media-groups.json');
    const filtered = groups.filter(g => g.id !== id);
    await writeJsonFile('media-groups.json', filtered);
  }

  return true;
}

// ============================================
// LIBRARY ITEMS (Biblioteca de Conteudos)
// ============================================

export async function getLibraryItems(): Promise<LibraryItem[]> {
  if (isRedisConfigured()) {
    return getAllEntities<LibraryItem>('library-items');
  }
  return readJsonFile<LibraryItem>('library-items.json');
}

export async function getLibraryItemById(id: string): Promise<LibraryItem | null> {
  if (isRedisConfigured()) {
    return getEntity<LibraryItem>('library-items', id);
  }
  const items = await readJsonFile<LibraryItem>('library-items.json');
  return items.find(i => i.id === id) || null;
}

export async function getLibraryItemsByFolder(folder: string): Promise<LibraryItem[]> {
  const items = await getLibraryItems();
  return items.filter(i => i.folder === folder);
}

export async function getLibraryItemsByAdvertiserId(advertiserId: string): Promise<LibraryItem[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`library-items:byAdvertiser:${advertiserId}`);
    if (ids.length === 0) return [];
    const items = await Promise.all(ids.map(id => getEntity<LibraryItem>('library-items', id)));
    return items.filter((i): i is LibraryItem => i !== null);
  }
  const items = await readJsonFile<LibraryItem>('library-items.json');
  return items.filter(i => i.advertiserId === advertiserId);
}

export async function createLibraryItem(data: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryItem> {
  const item: LibraryItem = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('library-items', item.id, item);
    if (item.advertiserId) {
      await addToIndex(`library-items:byAdvertiser:${item.advertiserId}`, item.id);
    }
    if (item.folder) {
      await addToIndex(`library-items:byFolder:${item.folder}`, item.id);
    }
    await addToIndex(`library-items:byType:${item.fileType}`, item.id);
  } else {
    const items = await readJsonFile<LibraryItem>('library-items.json');
    items.push(item);
    await writeJsonFile('library-items.json', items);
  }

  return item;
}

export async function updateLibraryItem(id: string, updates: Partial<LibraryItem>): Promise<LibraryItem | null> {
  const existing = await getLibraryItemById(id);
  if (!existing) return null;

  const updated: LibraryItem = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    // Update folder index if changed
    if (updates.folder !== undefined && updates.folder !== existing.folder) {
      if (existing.folder) {
        await removeFromIndex(`library-items:byFolder:${existing.folder}`, id);
      }
      if (updates.folder) {
        await addToIndex(`library-items:byFolder:${updates.folder}`, id);
      }
    }
    // Update advertiser index if changed
    if (updates.advertiserId !== undefined && updates.advertiserId !== existing.advertiserId) {
      if (existing.advertiserId) {
        await removeFromIndex(`library-items:byAdvertiser:${existing.advertiserId}`, id);
      }
      if (updates.advertiserId) {
        await addToIndex(`library-items:byAdvertiser:${updates.advertiserId}`, id);
      }
    }
    await setEntity('library-items', id, updated);
  } else {
    const items = await readJsonFile<LibraryItem>('library-items.json');
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = updated;
      await writeJsonFile('library-items.json', items);
    }
  }

  return updated;
}

export async function deleteLibraryItem(id: string): Promise<boolean> {
  const existing = await getLibraryItemById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    if (existing.folder) {
      await removeFromIndex(`library-items:byFolder:${existing.folder}`, id);
    }
    if (existing.advertiserId) {
      await removeFromIndex(`library-items:byAdvertiser:${existing.advertiserId}`, id);
    }
    await removeFromIndex(`library-items:byType:${existing.fileType}`, id);
    await deleteEntity('library-items', id);
  } else {
    const items = await readJsonFile<LibraryItem>('library-items.json');
    const filtered = items.filter(i => i.id !== id);
    await writeJsonFile('library-items.json', filtered);
  }

  return true;
}

// ============================================
// LIBRARY FOLDERS (Pastas da Biblioteca)
// ============================================

export async function getLibraryFolders(): Promise<LibraryFolder[]> {
  if (isRedisConfigured()) {
    return getAllEntities<LibraryFolder>('library-folders');
  }
  return readJsonFile<LibraryFolder>('library-folders.json');
}

export async function getLibraryFolderById(id: string): Promise<LibraryFolder | null> {
  if (isRedisConfigured()) {
    return getEntity<LibraryFolder>('library-folders', id);
  }
  const folders = await readJsonFile<LibraryFolder>('library-folders.json');
  return folders.find(f => f.id === id) || null;
}

export async function createLibraryFolder(data: Omit<LibraryFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<LibraryFolder> {
  const folder: LibraryFolder = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('library-folders', folder.id, folder);
    await setSlugMapping('library-folders', folder.slug, folder.id);
  } else {
    const folders = await readJsonFile<LibraryFolder>('library-folders.json');
    folders.push(folder);
    await writeJsonFile('library-folders.json', folders);
  }

  return folder;
}

export async function updateLibraryFolder(id: string, updates: Partial<LibraryFolder>): Promise<LibraryFolder | null> {
  const existing = await getLibraryFolderById(id);
  if (!existing) return null;

  const updated: LibraryFolder = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    if (updates.slug && updates.slug !== existing.slug) {
      await deleteSlugMapping('library-folders', existing.slug);
      await setSlugMapping('library-folders', updates.slug, id);
    }
    await setEntity('library-folders', id, updated);
  } else {
    const folders = await readJsonFile<LibraryFolder>('library-folders.json');
    const index = folders.findIndex(f => f.id === id);
    if (index !== -1) {
      folders[index] = updated;
      await writeJsonFile('library-folders.json', folders);
    }
  }

  return updated;
}

export async function deleteLibraryFolder(id: string): Promise<boolean> {
  const existing = await getLibraryFolderById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await deleteSlugMapping('library-folders', existing.slug);
    await deleteEntity('library-folders', id);
  } else {
    const folders = await readJsonFile<LibraryFolder>('library-folders.json');
    const filtered = folders.filter(f => f.id !== id);
    await writeJsonFile('library-folders.json', filtered);
  }

  return true;
}

// ============================================
// REMOTE COMMANDS (Comandos Remotos)
// ============================================

export async function getRemoteCommands(): Promise<RemoteCommand[]> {
  if (isRedisConfigured()) {
    return getAllEntities<RemoteCommand>('remote-commands');
  }
  return readJsonFile<RemoteCommand>('remote-commands.json');
}

export async function getRemoteCommandById(id: string): Promise<RemoteCommand | null> {
  if (isRedisConfigured()) {
    return getEntity<RemoteCommand>('remote-commands', id);
  }
  const commands = await readJsonFile<RemoteCommand>('remote-commands.json');
  return commands.find(c => c.id === id) || null;
}

export async function getRemoteCommandsByMonitorId(monitorId: string): Promise<RemoteCommand[]> {
  if (isRedisConfigured()) {
    const ids = await getFromIndex(`remote-commands:byMonitor:${monitorId}`);
    if (ids.length === 0) return [];
    const commands = await Promise.all(ids.map(id => getEntity<RemoteCommand>('remote-commands', id)));
    return commands.filter((c): c is RemoteCommand => c !== null);
  }
  const commands = await readJsonFile<RemoteCommand>('remote-commands.json');
  return commands.filter(c => c.monitorId === monitorId);
}

export async function getPendingCommandsForMonitor(monitorId: string): Promise<RemoteCommand[]> {
  const commands = await getRemoteCommandsByMonitorId(monitorId);
  return commands.filter(c => c.status === 'pending' || c.status === 'sent');
}

export async function createRemoteCommand(
  data: Omit<RemoteCommand, 'id' | 'createdAt' | 'status'>
): Promise<RemoteCommand> {
  const command: RemoteCommand = {
    ...data,
    id: Date.now().toString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    await setEntity('remote-commands', command.id, command);
    await addToIndex(`remote-commands:byMonitor:${command.monitorId}`, command.id);
    await addToIndex(`remote-commands:byStatus:${command.status}`, command.id);
  } else {
    const commands = await readJsonFile<RemoteCommand>('remote-commands.json');
    commands.push(command);
    await writeJsonFile('remote-commands.json', commands);
  }

  return command;
}

export async function updateRemoteCommand(
  id: string,
  updates: Partial<RemoteCommand>
): Promise<RemoteCommand | null> {
  const existing = await getRemoteCommandById(id);
  if (!existing) return null;

  const updated: RemoteCommand = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
  };

  if (isRedisConfigured()) {
    // Update status index if changed
    if (updates.status && updates.status !== existing.status) {
      await removeFromIndex(`remote-commands:byStatus:${existing.status}`, id);
      await addToIndex(`remote-commands:byStatus:${updates.status}`, id);
    }
    await setEntity('remote-commands', id, updated);
  } else {
    const commands = await readJsonFile<RemoteCommand>('remote-commands.json');
    const index = commands.findIndex(c => c.id === id);
    if (index !== -1) {
      commands[index] = updated;
      await writeJsonFile('remote-commands.json', commands);
    }
  }

  return updated;
}

export async function deleteRemoteCommand(id: string): Promise<boolean> {
  const existing = await getRemoteCommandById(id);
  if (!existing) return false;

  if (isRedisConfigured()) {
    await removeFromIndex(`remote-commands:byMonitor:${existing.monitorId}`, id);
    await removeFromIndex(`remote-commands:byStatus:${existing.status}`, id);
    await deleteEntity('remote-commands', id);
  } else {
    const commands = await readJsonFile<RemoteCommand>('remote-commands.json');
    const filtered = commands.filter(c => c.id !== id);
    await writeJsonFile('remote-commands.json', filtered);
  }

  return true;
}

// Limpar comandos antigos (mais de 7 dias)
export async function cleanupOldCommands(): Promise<number> {
  const commands = await getRemoteCommands();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  let deletedCount = 0;
  for (const command of commands) {
    const createdAt = new Date(command.createdAt);
    if (createdAt < sevenDaysAgo && (command.status === 'executed' || command.status === 'failed')) {
      await deleteRemoteCommand(command.id);
      deletedCount++;
    }
  }

  return deletedCount;
}
