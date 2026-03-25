import type { IServerConfig } from '../config/types';
import type {
  ClockPort,
  JobsQueuePort,
  LoggerPort,
  MetricsPort,
  ProfilesReadPort,
  StreamTextPort,
} from '../../application/ports/out';

export type TRequestWithId = {
  requestId?: string;
};

export interface QueueRuntimeDiagnostics {
  workerReady: boolean;
  workerPath: string;
  workerRuntime: string;
}

export interface RuntimeDiagnostics {
  buildMarker: string;
  queue: QueueRuntimeDiagnostics;
}

export interface AppDependencies {
  config: IServerConfig;
  logger: LoggerPort;
  clock: ClockPort;
  metrics: MetricsPort;
  profiles: ProfilesReadPort;
  jobs: JobsQueuePort;
  streamText: StreamTextPort;
  runtime: RuntimeDiagnostics;
  isShuttingDown: () => boolean;
}
