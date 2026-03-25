import type { Express } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';
import { API_ROUTES } from '../../contracts';
import { createMetricsController } from './controller';

export function registerMetricsRoutes(app: Express, deps: AppDependencies): void {
  app.get(API_ROUTES.METRICS, createMetricsController(deps));
}
