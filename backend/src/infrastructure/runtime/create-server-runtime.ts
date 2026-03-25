import http from 'node:http';
import { Server } from 'socket.io';
import { registerJobsSocketBridge } from '../../adapters/inbound/socket/register-jobs-socket-gateway';
import {
  InMemoryJobsQueueAdapter,
  resolveInMemoryQueueWorkerRuntime,
} from '../../adapters/outbound/in-memory/jobs-queue-adapter';
import { InMemoryProfilesReadAdapter } from '../../adapters/outbound/in-memory/profiles-read-adapter';
import { InMemoryStreamTextAdapter } from '../../adapters/outbound/in-memory/stream-text-adapter';
import { createApp } from '../http/create-app';
import type { AppDependencies } from '../http/types';
import { SystemClock } from '../clock/system-clock';
import { createConfig } from '../config';
import { MetricsService } from '../metrics';
import { createLogger } from '../observability';
import type { IRuntimeOptions, IServerRuntime } from './types';

const RUNTIME_BUILD_MARKER = 'presight-backend-queue-runtime-v1';

export function createServerRuntime(options: IRuntimeOptions = {}): IServerRuntime {
  const config = createConfig(options);
  const defaultQueueWorkerRuntime = resolveInMemoryQueueWorkerRuntime();
  const profiles = options.profileRepository ?? new InMemoryProfilesReadAdapter();

  if (!options.jobQueue && !defaultQueueWorkerRuntime.workerReady) {
    const checkedPaths = defaultQueueWorkerRuntime.checkedPaths.join(', ');
    throw new Error(
      `Queue worker runtime is not ready. Could not locate worker script. Checked paths: ${checkedPaths}.`,
    );
  }

  const jobs =
    options.jobQueue ??
    new InMemoryJobsQueueAdapter({
      delayMs: config.jobDelayMs,
      maxQueueSize: config.maxQueueSize,
      maxStoredJobs: config.maxStoredJobs,
      jobTtlMs: config.jobTtlMs,
      cleanupIntervalMs: config.jobCleanupIntervalMs,
      workerConcurrency: config.queueWorkerConcurrency,
      workerPath: defaultQueueWorkerRuntime.workerPath,
      workerExecArgv: defaultQueueWorkerRuntime.workerExecArgv,
    });
  const metrics = options.metrics ?? new MetricsService();
  const logger = createLogger(config.appName);
  const streamText = options.streamText ?? new InMemoryStreamTextAdapter();
  const clock = new SystemClock();

  let isShuttingDown = false;

  const dependencies: AppDependencies = {
    config,
    logger,
    clock,
    metrics,
    profiles,
    jobs,
    streamText,
    runtime: {
      buildMarker: RUNTIME_BUILD_MARKER,
      queue: {
        workerReady: options.jobQueue ? true : defaultQueueWorkerRuntime.workerReady,
        workerPath: options.jobQueue ? 'custom-job-queue' : defaultQueueWorkerRuntime.workerPath,
        workerRuntime: options.jobQueue ? 'custom' : defaultQueueWorkerRuntime.workerRuntime,
      },
    },
    isShuttingDown: () => isShuttingDown,
  };

  const app = createApp(dependencies);
  const server = http.createServer(app);

  const socketOrigins = new Set(config.corsOrigins);
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || socketOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Socket origin is not allowed.'));
      },
      methods: ['GET', 'POST'],
    },
  });

  registerJobsSocketBridge({ io, jobs, metrics, clock });

  return {
    app,
    server,
    io,
    config,
    metrics,
    services: {
      profiles,
      jobs,
    },
    start() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(config.port, () => {
          server.off('error', reject);
          resolve();
        });
      });
    },
    async close() {
      isShuttingDown = true;
      jobs.stopAccepting();
      await jobs.close(config.shutdownGraceMs);

      await new Promise<void>((resolve, reject) => {
        io.close();

        if (!server.listening) {
          resolve();
          return;
        }

        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    },
  };
}
