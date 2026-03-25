import type { Express } from 'express';
import type { AppDependencies } from '@/infrastructure/http/types';
import { GetStreamTextUseCase } from '@/application/usecases/stream-text/get-stream-text';
import { API_ROUTES } from '../../contracts';
import { createStreamTextController } from './controller';

export function registerStreamTextRoutes(app: Express, deps: AppDependencies): void {
  const useCase = new GetStreamTextUseCase(deps.streamText);
  app.get(API_ROUTES.STREAM_TEXT, createStreamTextController(useCase));
}
