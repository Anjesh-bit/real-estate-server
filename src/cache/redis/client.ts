import type { RedisClientType } from "redis";

import { redisConnection } from "#connections/redis.js";
import logger from "#lib/helpers/winston.helpers.js";

class RedisClient {
  private client: null | RedisClientType;
  private readonly defaultTTL: number;

  constructor() {
    this.client = null;
    this.defaultTTL = 3600; // 1 hour default TTL for redis entries
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error("Redis DEL error:", error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error("Redis EXPIRE error:", error);
      return false;
    }
  }

  async flushdb(): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      await this.client.flushDb();
      return true;
    } catch (error) {
      logger.error("Redis FLUSHDB error:", error);
      return false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis GET error:", error);
      return null;
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const value = await this.client.hGet(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis HGET error:", error);
      return null;
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const hash = await this.client.hGetAll(key);
      const result: Record<string, T> = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      logger.error("Redis HGETALL error:", error);
      return {};
    }
  }

  async hset<T>(
    key: string,
    field: string,
    value: T,
    ttl: number = this.defaultTTL,
  ): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const serializedValue = JSON.stringify(value);
      await this.client.hSet(key, field, serializedValue);
      if (ttl) {
        await this.client.expire(key, ttl);
      }
      return true;
    } catch (error) {
      logger.error("Redis HSET error:", error);
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      return await this.client.incr(key);
    } catch (error) {
      logger.error("Redis INCR error:", error);
      return 0;
    }
  }

  async incrby(key: string, increment: number): Promise<number> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      return await this.client.incrBy(key, increment);
    } catch (error) {
      logger.error("Redis INCRBY error:", error);
      return 0;
    }
  }

  initialize(): void {
    this.client = redisConnection.getClient();
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error("Redis KEYS error:", error);
      return [];
    }
  }

  async lpush<T>(key: string, value: T): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const serializedValue = JSON.stringify(value);
      await this.client.lPush(key, serializedValue);
      return true;
    } catch (error) {
      logger.error("Redis LPUSH error:", error);
      return false;
    }
  }

  async lrange<T>(key: string, start = 0, stop = -1): Promise<T[]> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const values = await this.client.lRange(key, start, stop);
      return values.map((value) => JSON.parse(value));
    } catch (error) {
      logger.error("Redis LRANGE error:", error);
      return [];
    }
  }

  async rpop<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const value = await this.client.rPop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis RPOP error:", error);
      return null;
    }
  }

  async sadd<T>(key: string, value: T): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const serializedValue = JSON.stringify(value);
      await this.client.sAdd(key, serializedValue);
      return true;
    } catch (error) {
      logger.error("Redis SADD error:", error);
      return false;
    }
  }

  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error("Redis SET error:", error);
      return false;
    }
  }

  async smembers<T>(key: string): Promise<T[]> {
    try {
      if (!this.client) {
        throw new Error("Redis client not initialized");
      }
      const members = await this.client.sMembers(key);
      return members.map((member) => JSON.parse(member));
    } catch (error) {
      logger.error("Redis SMEMBERS error:", error);
      return [];
    }
  }
}

export const redisClient = new RedisClient();
