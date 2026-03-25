import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function createRequestIdMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incomingRequestId = typeof req.headers['x-request-id'] === 'string' ? req.headers['x-request-id'] : '';
    const requestId = incomingRequestId.trim() || crypto.randomUUID();
    (req as Request & { requestId?: string }).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  };
}

export function getRequestId(req: Request): string {
  return (req as Request & { requestId?: string }).requestId ?? 'unknown-request';
}
