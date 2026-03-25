import type { NextFunction, Request, Response } from 'express';
import type { MetricsPort } from '@/application/ports/out';

export function createHttpMetricsMiddleware(metrics: MetricsPort) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const route = req.route?.path ? String(req.route.path) : req.path;

      metrics.observeHttp({
        method: req.method,
        route,
        statusCode: res.statusCode,
        durationMs,
      });
    });

    next();
  };
}
