import type { Request } from "express";

export type CacheOptions = {
  condition?: (req: Request) => boolean;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  ttl?: number;
};
