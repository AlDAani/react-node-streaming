import type { Request, Response } from 'express';
import { ERROR_CODES } from '../../../adapters/inbound/http/errors/constants';
import { getRequestId } from './request-id';

export function createNotFoundHandler() {
  return (req: Request, res: Response): void => {
    res.status(404).json({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Route not found.',
        details: null,
        requestId: getRequestId(req),
      },
    });
  };
}
