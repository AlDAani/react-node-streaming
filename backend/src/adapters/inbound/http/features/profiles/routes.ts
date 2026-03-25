import type { Express } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';
import { API_ROUTES } from '../../contracts';
import { createListProfilesController, createProfilesFacetsController } from './controller';
import { ProfilesService } from './service';

export function registerProfilesRoutes(app: Express, deps: AppDependencies): void {
  const service = new ProfilesService(deps.profiles);

  app.get(API_ROUTES.PROFILES, createListProfilesController(service, deps.config));
  app.get(API_ROUTES.PROFILES_FACETS, createProfilesFacetsController(service));
}
