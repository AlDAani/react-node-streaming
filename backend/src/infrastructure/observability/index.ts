import pino from 'pino';
import type { LoggerPort } from '../../application/ports/out';

export function createLogger(appName: string): LoggerPort {
  return pino({
    name: appName,
    level: process.env.LOG_LEVEL ?? 'info',
  });
}
