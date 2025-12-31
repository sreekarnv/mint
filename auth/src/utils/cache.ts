import { getRedisClient } from "./redis";
import { logger } from "./logger";
import { cacheHits, cacheMisses, cacheErrors } from "~/middleware/metrics";

const DEFAULT_TTL = 300; // 5 minutes

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);

    const keyPrefix = key.split(":").slice(0, 2).join(":");

    if (!data) {
      cacheMisses.inc({ cache_key_prefix: keyPrefix });
      return null;
    }

    cacheHits.inc({ cache_key_prefix: keyPrefix });
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error(`Cache GET error for key ${key}:`, error);
    cacheErrors.inc({ operation: "get" });
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number = DEFAULT_TTL): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error(`Cache SET error for key ${key}:`, error);
    cacheErrors.inc({ operation: "set" });
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    logger.error(`Cache DELETE error for key ${key}:`, error);
    cacheErrors.inc({ operation: "delete" });
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error(`Cache DELETE PATTERN error for pattern ${pattern}:`, error);
    cacheErrors.inc({ operation: "delete_pattern" });
  }
}
