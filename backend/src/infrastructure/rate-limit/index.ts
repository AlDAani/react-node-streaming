import { Request } from 'express';
import { ApiError } from '../../adapters/inbound/http/errors';
import { DEFAULT_RATE_LIMIT_MAX_REQUESTS, DEFAULT_RATE_LIMIT_WINDOW_MS } from './constants';
import { IRateLimitOptions, TRateLimitMiddleware } from './types';

interface IRateLimitRecord {
  count: number;
  resetAt: number;
}

function getRequestIp(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0]?.trim() ?? req.ip ?? 'unknown-ip';
  }

  if (Array.isArray(forwardedFor) && forwardedFor[0]) {
    return forwardedFor[0];
  }

  return req.ip ?? 'unknown-ip';
}

export function createRateLimitMiddleware(options: Partial<IRateLimitOptions> = {}): TRateLimitMiddleware {
  const windowMs = options.windowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS;
  const maxRequests = options.maxRequests ?? DEFAULT_RATE_LIMIT_MAX_REQUESTS;
  const getKey = options.getKey ?? ((ip: string) => ip);
  const storage = new Map<string, IRateLimitRecord>();

  return (req, _res, next) => {
    const now = Date.now();
    const ip = getRequestIp(req);
    const key = getKey(ip);

    for (const [recordKey, record] of storage.entries()) {
      if (record.resetAt <= now) {
        storage.delete(recordKey);
      }
    }

    const current = storage.get(key);
    if (!current || current.resetAt <= now) {
      storage.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    if (current.count >= maxRequests) {
      next(new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded. Please retry later.'));
      return;
    }

    current.count += 1;
    storage.set(key, current);
    next();
  };
}

export type { IRateLimitOptions, TRateLimitMiddleware } from './types';
