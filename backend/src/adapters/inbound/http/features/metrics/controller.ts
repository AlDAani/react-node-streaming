import type { Request, Response } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';

export function createMetricsController(deps: AppDependencies) {
  return async (_req: Request, res: Response): Promise<void> => {
    const payload = await deps.metrics.metrics();
    res.setHeader('content-type', deps.metrics.contentType);
    res.status(200).send(payload);
  };
}
