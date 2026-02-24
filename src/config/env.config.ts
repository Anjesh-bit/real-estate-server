import crypto from "crypto";

import dotenv from "dotenv";
import { z } from "zod";

import { ENVIRONMENT } from "#constants/env.constant.js";

dotenv.config({ path: `.env.${process.env.NODE_ENV ?? "development"}` });

const secret = crypto.randomBytes(64).toString("hex");

const envSchema = z.object({
  AUTH_MAX_ATTEMPTS: z.string().default("5"),
  CLIENT_URL: z.string().min(1, "CLIENT_URL is required").default("http://localhost:3000"),
  DB_NAME: z.string().min(1, "DB_NAME is required").default("real_estate_portal"),
  JWT_ACCESS_TOKEN_EXPIRY: z.string().default("15m"),
  JWT_ACCESS_TOKEN_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 chars long"),
  JWT_ALGORITHM: z.string().default("HS256"),
  JWT_AUDIENCE: z.string().min(1, "JWT_AUDIENCE is required").default("app-users"),
  JWT_CLOCK_TOLERANCE: z.string().default("30"),
  JWT_ISSUER: z.string().min(1, "JWT_ISSUER is required").default("app-name"),
  JWT_REFRESH_TOKEN_EXPIRY: z.string().default("30d"),
  JWT_REFRESH_TOKEN_SECRET: z.string().min(10, "JWT_SECRET must be at least 10 chars long"),
  JWT_SECRETE_KEY: z.string().default(secret),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  NODE_ENV: z.enum(ENVIRONMENT).default("development"),
  PORT: z.string().transform(Number).default(5000),
  WINDOW_MS: z.string().default((15 * 60 * 1000).toString()),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_DEV_PASSWORD: z.string().optional(),
  REDIS_DEV_HOST: z.string().default("localhost"),
  REDIS_DEV_PORT: z.string().transform(Number).default(6379),
  REDIS_TEST_PASSWORD: z.string().optional(),
  REDIS_TEST_HOST: z.string().default("localhost"),
  REDIS_TEST_PORT: z.string().transform(Number).default(6380),
  REDIS_TLS: z.string().default("false"),
  COOKIE_DOMAIN: z.string().default("localhost"),
});

export const ENV = envSchema.parse(process.env);
