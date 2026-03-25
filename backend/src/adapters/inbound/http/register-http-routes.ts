import type { Express } from 'express';
import type { AppDependencies } from '../../../infrastructure/http/types';
import { registerHealthRoutes } from './features/health/routes';
import { registerMetricsRoutes } from './features/metrics/routes';
import { registerProfilesRoutes } from './features/profiles/routes';
import { registerStreamTextRoutes } from './features/stream-text/routes';
import { registerJobsRoutes } from './features/jobs/routes';

export function registerHttpRoutes(app: Express, deps: AppDependencies): void {
  registerHealthRoutes(app, deps);
  registerMetricsRoutes(app, deps);
  registerProfilesRoutes(app, deps);
  registerStreamTextRoutes(app, deps);
  registerJobsRoutes(app, deps);
}
