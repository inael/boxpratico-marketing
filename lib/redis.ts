import { Redis } from '@upstash/redis';

// Singleton Redis client
let redis: Redis | null = null;

// Environment variable names from Upstash Vercel integration
const REDIS_URL = process.env.upstash_boxpratico_marketing_KV_REST_API_URL;
const REDIS_TOKEN = process.env.upstash_boxpratico_marketing_KV_REST_API_TOKEN;

export function getRedis(): Redis {
  if (!redis) {
    // Check if we have Redis credentials
    if (!REDIS_URL || !REDIS_TOKEN) {
      throw new Error('Missing upstash_boxpratico_marketing_KV_REST_API_URL or upstash_boxpratico_marketing_KV_REST_API_TOKEN environment variables');
    }

    redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
  }
  return redis;
}

// Check if Redis is configured
export function isRedisConfigured(): boolean {
  return !!(REDIS_URL && REDIS_TOKEN);
}

// Generic CRUD operations for entities

export async function getEntity<T>(prefix: string, id: string): Promise<T | null> {
  const redis = getRedis();
  const data = await redis.get<T>(`${prefix}:${id}`);
  return data;
}

export async function getAllEntities<T>(prefix: string): Promise<T[]> {
  const redis = getRedis();
  const ids = await redis.smembers(`${prefix}:index`);

  if (ids.length === 0) return [];

  const pipeline = redis.pipeline();
  for (const id of ids) {
    pipeline.get(`${prefix}:${id}`);
  }

  const results = await pipeline.exec<(T | null)[]>();
  return results.filter((item): item is T => item !== null);
}

export async function setEntity<T>(prefix: string, id: string, data: T): Promise<void> {
  const redis = getRedis();
  await redis.pipeline()
    .set(`${prefix}:${id}`, JSON.stringify(data))
    .sadd(`${prefix}:index`, id)
    .exec();
}

export async function deleteEntity(prefix: string, id: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.pipeline()
    .del(`${prefix}:${id}`)
    .srem(`${prefix}:index`, id)
    .exec();

  // Upstash pipeline returns array of results, check if delete was successful
  // Result format: [deleteResult, sremResult] where deleteResult >= 0 means success
  return Array.isArray(result) && result.length > 0;
}

// Index operations for relationships
export async function addToIndex(indexKey: string, id: string): Promise<void> {
  const redis = getRedis();
  await redis.sadd(indexKey, id);
}

export async function removeFromIndex(indexKey: string, id: string): Promise<void> {
  const redis = getRedis();
  await redis.srem(indexKey, id);
}

export async function getFromIndex(indexKey: string): Promise<string[]> {
  const redis = getRedis();
  return await redis.smembers(indexKey);
}

// Slug lookup operations
export async function setSlugMapping(prefix: string, slug: string, id: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`${prefix}:slug:${slug}`, id);
}

export async function getIdBySlug(prefix: string, slug: string): Promise<string | null> {
  const redis = getRedis();
  return await redis.get(`${prefix}:slug:${slug}`);
}

export async function deleteSlugMapping(prefix: string, slug: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`${prefix}:slug:${slug}`);
}

// Hash-based deduplication for media files
export async function getMediaByHash(hash: string): Promise<string | null> {
  const redis = getRedis();
  return await redis.get(`media-hash:${hash}`);
}

export async function setMediaHash(hash: string, url: string): Promise<void> {
  const redis = getRedis();
  await redis.set(`media-hash:${hash}`, url);
}
