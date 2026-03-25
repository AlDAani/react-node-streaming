import { z } from 'zod';
import {
  APP_NAME,
  DEFAULT_CORS_ORIGINS,
  DEFAULT_JOB_CLEANUP_INTERVAL_MS,
  DEFAULT_JOB_DELAY_MS,
  DEFAULT_JOB_TTL_MS,
  DEFAULT_MAX_QUEUE_SIZE,
  DEFAULT_MAX_STORED_JOBS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PORT,
  DEFAULT_QUEUE_WORKER_CONCURRENCY,
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_SHUTDOWN_GRACE_MS,
  MAX_PAGE_SIZE,
} from './constants';
import { IServerConfig, TConfigOverrides } from './types';

function normalizeOrigins(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [...DEFAULT_CORS_ORIGINS];
}

const configSchema = z
  .object({
    appName: z.string().min(1).default(APP_NAME),
    port: z.coerce.number().int().min(0).max(65535).default(DEFAULT_PORT),
    corsOrigins: z
      .preprocess(normalizeOrigins, z.array(z.string().regex(/^https?:\/\//, 'Origin must start with http:// or https://')).min(1))
      .default([...DEFAULT_CORS_ORIGINS]),
    pageSizeDefault: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    pageSizeMax: z.coerce.number().int().min(1).max(200).default(MAX_PAGE_SIZE),
    jobDelayMs: z.coerce.number().int().min(1).max(60_000).default(DEFAULT_JOB_DELAY_MS),
    queueWorkerConcurrency: z.coerce.number().int().min(1).max(200).default(DEFAULT_QUEUE_WORKER_CONCURRENCY),
    maxQueueSize: z.coerce.number().int().min(1).max(100_000).default(DEFAULT_MAX_QUEUE_SIZE),
    maxStoredJobs: z.coerce.number().int().min(1).max(200_000).default(DEFAULT_MAX_STORED_JOBS),
    jobTtlMs: z.coerce.number().int().min(1_000).max(24 * 60 * 60 * 1_000).default(DEFAULT_JOB_TTL_MS),
    jobCleanupIntervalMs: z.coerce.number().int().min(1_000).max(60 * 60 * 1_000).default(DEFAULT_JOB_CLEANUP_INTERVAL_MS),
    rateLimitWindowMs: z.coerce.number().int().min(1_000).max(60 * 60 * 1_000).default(DEFAULT_RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: z.coerce.number().int().min(1).max(10_000).default(DEFAULT_RATE_LIMIT_MAX_REQUESTS),
    shutdownGraceMs: z.coerce.number().int().min(1_000).max(60_000).default(DEFAULT_SHUTDOWN_GRACE_MS),
  })
  .superRefine((input, ctx) => {
    if (input.pageSizeDefault > input.pageSizeMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'pageSizeDefault must be less than or equal to pageSizeMax.',
        path: ['pageSizeDefault'],
      });
    }

    if (input.maxStoredJobs < input.maxQueueSize) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'maxStoredJobs must be greater than or equal to maxQueueSize.',
        path: ['maxStoredJobs'],
      });
    }
  });

export function createConfig(overrides: TConfigOverrides = {}): IServerConfig {
  return configSchema.parse({
    appName: overrides.appName ?? process.env.APP_NAME,
    port: overrides.port ?? process.env.PORT,
    corsOrigins: overrides.corsOrigins ?? process.env.CORS_ORIGINS,
    pageSizeDefault: overrides.pageSizeDefault ?? process.env.PAGE_SIZE_DEFAULT,
    pageSizeMax: overrides.pageSizeMax ?? process.env.PAGE_SIZE_MAX,
    jobDelayMs: overrides.jobDelayMs ?? process.env.JOB_DELAY_MS,
    queueWorkerConcurrency: overrides.queueWorkerConcurrency ?? process.env.QUEUE_WORKER_CONCURRENCY,
    maxQueueSize: overrides.maxQueueSize ?? process.env.MAX_QUEUE_SIZE,
    maxStoredJobs: overrides.maxStoredJobs ?? process.env.MAX_STORED_JOBS,
    jobTtlMs: overrides.jobTtlMs ?? process.env.JOB_TTL_MS,
    jobCleanupIntervalMs: overrides.jobCleanupIntervalMs ?? process.env.JOB_CLEANUP_INTERVAL_MS,
    rateLimitWindowMs: overrides.rateLimitWindowMs ?? process.env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: overrides.rateLimitMaxRequests ?? process.env.RATE_LIMIT_MAX_REQUESTS,
    shutdownGraceMs: overrides.shutdownGraceMs ?? process.env.SHUTDOWN_GRACE_MS,
  });
}

export type { IServerConfig, TConfigOverrides } from './types';
