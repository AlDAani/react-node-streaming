import { RequestHandler } from 'express';

export interface IRateLimitOptions {
  windowMs: number;
  maxRequests: number;
  getKey?: (ip: string) => string;
}

export type TRateLimitMiddleware = RequestHandler;
