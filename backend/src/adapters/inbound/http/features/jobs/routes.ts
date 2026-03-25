import type { Express } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';
import { API_ROUTES } from '../../contracts';
import { createRateLimitMiddleware } from '@/infrastructure/rate-limit';
import { createEnqueueJobController, createGetJobController, createListJobsController } from './controller';
import { JobsService } from './service';

export function registerJobsRoutes(app: Express, deps: AppDependencies): void {
  const jobsRateLimit = createRateLimitMiddleware({
    windowMs: deps.config.rateLimitWindowMs,
    maxRequests: deps.config.rateLimitMaxRequests,
  });
  const service = new JobsService(deps.jobs, deps.isShuttingDown);

  app.get(API_ROUTES.JOBS, createListJobsController(service));
  app.get(`${API_ROUTES.JOBS}/:jobId`, createGetJobController(service));
  app.post(API_ROUTES.JOBS, jobsRateLimit, createEnqueueJobController(service));
}
