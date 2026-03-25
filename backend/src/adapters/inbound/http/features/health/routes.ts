import type { Express } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';
import { API_ROUTES } from '../../contracts';
import { createHealthController } from './controller';

export function registerHealthRoutes(app: Express, deps: AppDependencies): void {
  app.get(API_ROUTES.HEALTH, createHealthController(deps));
}
