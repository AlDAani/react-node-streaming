import type { Request, Response } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';
import { getRequestId } from '@/infrastructure/http/middleware/request-id';

export function createHealthController(deps: AppDependencies) {
  return (req: Request, res: Response): void => {
    res.json({
      data: {
        status: 'ok',
        service: deps.config.appName,
        uptimeSeconds: Math.round(process.uptime()),
        profilesCount: deps.profiles.count(),
        queue: deps.jobs.getSnapshot(),
        runtime: deps.runtime,
      },
      meta: {
        requestId: getRequestId(req),
      },
    });
  };
}
