import { createClient, RedisClientType } from "redis";
import { CACHE_TTL, REDIS_KEYS } from "./constants";

// ===========================================
// Redis Client Singleton Pattern
// Uses globalThis to prevent multiple connections
// during Next.js hot-reloading in development
// ===========================================

// Use a simple approach with module-level variable
// that gets preserved in development via Next.js caching
let redisClient: RedisClientType | null = null;
let redisAvailable: boolean | null = null;

/**
 * Check if Redis is available without throwing
 * Returns cached result to avoid repeated connection attempts
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (redisAvailable !== null) {
    return redisAvailable;
  }

  try {
    const client = await getRedisClient();
    await client.ping();
    redisAvailable = true;
    return true;
  } catch {
    redisAvailable = false;
    return false;
  }
}

/**
 * Initialize Redis client with singleton pattern
 * Uses module-level caching to survive hot-reloads in dev mode
 * FAILS FAST when Redis is not available
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // If we already have a connected client, return it
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // If we have a client but it's closed, try to reconnect
  if (redisClient) {
    try {
      await redisClient.connect();
      return redisClient;
    } catch {
      // Fall through to create new client
      redisClient = null;
    }
  }

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  redisClient = createClient({
    url: redisUrl,
    socket: {
      // FAIL FAST: No retries, fail immediately if Redis unavailable
      reconnectStrategy: (retries) => {
        if (retries > 0) {
          return new Error("Redis connection failed");
        }
        return 100; // Initial retry delay (will fail fast)
      },
      connectTimeout: 2000, // 2 second timeout
    },
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err.message);
  });

  redisClient.on("connect", () => {
    console.log("Redis client connected");
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (error) {
    // Don't throw - just return null and let cache functions handle it
    console.warn("Redis unavailable, continuing without caching");
    redisClient = null;
    throw error; // Rethrow so caller knows Redis is unavailable
  }
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Get from memory cache (fallback when Redis unavailable)
 */
function memoryCacheGet<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (item && item.expiry > Date.now()) {
    return item.value as T;
  }
  memoryCache.delete(key);
  return null;
}

/**
 * Set to memory cache (fallback when Redis unavailable)
 */
function memoryCacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

// Generic cache functions - always fail fast, use memory fallback
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient();
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch {
    // Fail fast: don't retry, just use memory fallback
    return memoryCacheGet<T>(key);
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL.PLAYER
): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
    return true;
  } catch {
    // Fail fast: don't retry, just use memory fallback
    memoryCacheSet(key, value, ttlSeconds);
    return false;
  }
}

export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error("Redis cache delete error:", error);
    return false;
  }
}

export async function cacheExists(key: string): Promise<boolean> {
  try {
    const client = await getRedisClient();
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error("Redis cache exists error:", error);
    return false;
  }
}

// Player-specific cache functions
export async function getCachedPlayer(steamId: string) {
  const key = `${REDIS_KEYS.PLAYER}${steamId}`;
  return cacheGet(key);
}

export async function setCachedPlayer(steamId: string, data: unknown) {
  const key = `${REDIS_KEYS.PLAYER}${steamId}`;
  return cacheSet(key, data, CACHE_TTL.PLAYER);
}

export async function getCachedPlayerMatches(steamId: string, page: number = 1) {
  const key = `${REDIS_KEYS.PLAYER_MATCHES}${steamId}:${page}`;
  return cacheGet(key);
}

export async function setCachedPlayerMatches(
  steamId: string,
  page: number,
  data: unknown
) {
  const key = `${REDIS_KEYS.PLAYER_MATCHES}${steamId}:${page}`;
  return cacheSet(key, data, CACHE_TTL.MATCHES);
}

export async function getCachedPlayerHeroes(steamId: string) {
  const key = `${REDIS_KEYS.PLAYER_HEROES}${steamId}`;
  return cacheGet(key);
}

export async function setCachedPlayerHeroes(steamId: string, data: unknown) {
  const key = `${REDIS_KEYS.PLAYER_HEROES}${steamId}`;
  return cacheSet(key, data, CACHE_TTL.HEROES);
}

export async function getCachedPlayerPeers(steamId: string) {
  const key = `${REDIS_KEYS.PLAYER_PEERS}${steamId}`;
  return cacheGet(key);
}

export async function setCachedPlayerPeers(steamId: string, peerData: unknown) {
  const key = `${REDIS_KEYS.PLAYER_PEERS}${steamId}`;
  return cacheSet(key, peerData, CACHE_TTL.PEERS);
}

export async function getCachedHeroesData() {
  const key = `${REDIS_KEYS.HEROES_DATA}all`;
  return cacheGet(key);
}

export async function setCachedHeroesData(heroesData: unknown) {
  const key = `${REDIS_KEYS.HEROES_DATA}all`;
  return cacheSet(key, heroesData, CACHE_TTL.HEROES_DATA);
}

// In-memory fallback for when Redis is not available
const memoryCache = new Map<string, { value: unknown; expiry: number }>();

export async function getWithFallback<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try Redis first
  const cached = await cacheGet<T>(cacheKey);
  if (cached) {
    return cached;
  }

  // Try memory cache fallback
  const memCached = memoryCache.get(cacheKey);
  if (memCached && memCached.expiry > Date.now()) {
    return memCached.value as T;
  }

  // Fetch from source
  const data = await fetcher();

  // Cache in both Redis and memory
  await cacheSet(cacheKey, data, ttlSeconds);
  memoryCache.set(cacheKey, { value: data, expiry: Date.now() + ttlSeconds * 1000 });

  return data;
}

// Clear all caches (for development)
export async function clearAllCaches(): Promise<void> {
  try {
    const client = await getRedisClient();
    await client.flushAll();
    memoryCache.clear();
  } catch (error) {
    console.error("Error clearing caches:", error);
    memoryCache.clear();
  }
}
