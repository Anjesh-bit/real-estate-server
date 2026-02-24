import { redisClient } from "#cache/redis/client.js";
import logger from "#lib/helpers/winston.helpers.js";

class CacheAsideStrategy {
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(options: { prefix?: string; ttl?: number } = {}) {
    this.defaultTTL = options.ttl ?? 3600;
    this.keyPrefix = options.prefix ?? "";
  }

  buildKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  async delete(key: string): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    try {
      await redisClient.del(cacheKey);
      logger.debug(`Cache invalidated for key: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error("Cache-aside delete error:", error);
      return false;
    }
  }

  async get<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<null | T> {
    const cacheKey = this.buildKey(key);
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached !== null) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cached as T;
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      const data = await fetchFunction();
      if (data !== null && data !== undefined) {
        await redisClient.set(cacheKey, data, ttl);
        logger.debug(`Cached data for key: ${cacheKey}`);
      }
      return data;
    } catch (error) {
      logger.error("Cache-aside get error:", error);

      return await fetchFunction();
    }
  }

  async mget<T>(
    keys: string[],
    fetchFunction: (keys: string[]) => Promise<Record<string, T>>,
    ttl: number = this.defaultTTL,
  ): Promise<Record<string, T>> {
    const cacheKeys = keys.map((key) => this.buildKey(key));
    const results: Record<string, T> = {};
    const missedKeys: string[] = [];
    try {
      const cachedResults = await Promise.all(cacheKeys.map((key) => redisClient.get(key)));

      keys.forEach((originalKey, index) => {
        const cached = cachedResults[index];
        if (cached !== null) {
          results[originalKey] = cached as T;
        } else {
          missedKeys.push(originalKey);
        }
      });

      if (missedKeys.length > 0) {
        const fetchedData = await fetchFunction(missedKeys);

        const cachePromises: Promise<boolean>[] = [];
        Object.entries(fetchedData).forEach(([key, data]) => {
          results[key] = data;
          const cacheKey = this.buildKey(key);
          cachePromises.push(redisClient.set(cacheKey, data, ttl));
        });
        await Promise.all(cachePromises);
      }
      return results;
    } catch (error) {
      logger.error("Cache-aside mget error:", error);
      return await fetchFunction(keys);
    }
  }

  async set<T>(key: string, data: T, ttl: number = this.defaultTTL): Promise<boolean> {
    const cacheKey = this.buildKey(key);
    try {
      await redisClient.set(cacheKey, data, ttl);
      logger.debug(`Cache updated for key: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error("Cache-aside set error:", error);
      return false;
    }
  }

  async update<T>(
    key: string,
    updateFunction: (currentData: null | T) => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    const cacheKey = this.buildKey(key);
    try {
      const currentData = await redisClient.get(cacheKey);

      const updatedData = await updateFunction(currentData as null | T);

      if (updatedData !== null && updatedData !== undefined) {
        await redisClient.set(cacheKey, updatedData, ttl);
        logger.debug(`Cache updated for key: ${cacheKey}`);
      }
      return updatedData;
    } catch (error) {
      logger.error("Cache-aside update error:", error);
      throw error;
    }
  }
}

export default CacheAsideStrategy;
