import cors from 'cors';
import express, { Request } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { AppDependencies } from './types';
import { createErrorHandler } from './middleware/error-handler';
import { createHttpMetricsMiddleware } from './middleware/http-metrics';
import { createNotFoundHandler } from './middleware/not-found';
import { createRequestIdMiddleware, getRequestId } from './middleware/request-id';
import { registerHttpRoutes } from '../../adapters/inbound/http/register-http-routes';
import { ApiError } from '../../adapters/inbound/http/errors';
import { ERROR_CODES } from '../../adapters/inbound/http/errors/constants';
import { DEFAULT_JSON_LIMIT } from '../runtime/constants';

export function createApp(deps: AppDependencies) {
  const app = express();
  const socketOrigins = new Set(deps.config.corsOrigins);

  app.disable('x-powered-by');

  app.use(createRequestIdMiddleware());
  app.use(
    pinoHttp({
      logger: deps.logger,
      customProps: (req) => ({
        requestId: getRequestId(req as Request),
      }),
    }),
  );
  app.use(createHttpMetricsMiddleware(deps.metrics));
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || socketOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new ApiError(403, ERROR_CODES.CORS_DENIED, 'Origin is not allowed.'));
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'x-request-id'],
      optionsSuccessStatus: 204,
    }),
  );
  app.use(express.json({ limit: DEFAULT_JSON_LIMIT }));

  registerHttpRoutes(app, deps);

  app.use(createNotFoundHandler());
  app.use(createErrorHandler(deps.logger));

  return app;
}
