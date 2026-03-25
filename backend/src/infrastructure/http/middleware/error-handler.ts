import type { NextFunction, Request, Response } from 'express';
import type { LoggerPort } from '@/application/ports/out';
import { ApiError, createErrorPayload } from '../../../adapters/inbound/http/errors';
import { getRequestId } from './request-id';

export function createErrorHandler(logger: LoggerPort) {
  return (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = getRequestId(req);
    const payload = createErrorPayload(error, requestId);
    const statusCode = error instanceof ApiError ? error.statusCode : 500;

    if (statusCode >= 500) {
      logger.error({ err: error, requestId }, 'Unhandled backend error');
    }

    res.status(statusCode).json(payload);
  };
}
