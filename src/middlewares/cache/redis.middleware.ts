import type { NextFunction, Request, Response } from "express";

import { redisClient } from "#cache/redis/client.js";
import CacheAsideStrategy from "#cache/strategies/cacheAside.js";
import logger from "#lib/helpers/winston.helpers.js";
import type { CacheOptions } from "#types/redis.types.js";

const cache = (options: CacheOptions = {}) => {
  const {
    condition = () => true,
    keyGenerator = (req: Request) => `${req.method}:${req.originalUrl}`,
    skipCache = () => false,
    ttl = 3600,
  } = options;

  const cacheStrategy = new CacheAsideStrategy({ ttl });

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req) || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for: ${cacheKey}`);
        return res.json(cachedData);
      }
      logger.debug(`Cache miss for: ${cacheKey}`);
      const originalJson = res.json;
      res.json = (data) => {
        cacheStrategy.set(cacheKey, data, ttl).catch((error) => {
          logger.error("Failed to cache response:", error);
        });
        return originalJson.call(this, data);
      };
      next();
    } catch (error) {
      logger.error("Redis cache middleware error:", error);
      next();
    }
  };
};

const invalidate = (keyPattern: string) => {
  return async (_: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    res.json = (data) => {
      redisClient
        .keys(keyPattern)
        .then((keys) => {
          if (keys.length > 0) {
            return Promise.all(keys.map((key) => redisClient.del(key))).then(() => {
              logger.debug(`Invalidated ${keys.length} cache keys matching: ${keyPattern}`);
            });
          }
        })
        .catch((error) => {
          logger.error("Cache invalidation error:", error);
        });
      return originalJson.call(this, data);
    };
    next();
  };
};

const conditionalCache = (condition: (req: Request, res: Response) => boolean) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req, res)) {
      return cache()(req, res, next);
    }
    next();
  };
};

export { cache, conditionalCache, invalidate };
