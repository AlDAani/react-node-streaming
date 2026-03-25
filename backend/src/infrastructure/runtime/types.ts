import type { Server as THttpServer } from 'node:http';
import type { Express, Request } from 'express';
import type { Server as TSocketServer } from 'socket.io';
import type { IServerConfig, TConfigOverrides } from '../config/types';
import type { JobsQueuePort, MetricsPort, ProfilesReadPort, StreamTextPort } from '../../application/ports/out';
import type { IJobPayload, IListProfilesParams } from '../../application/contracts/input';

export interface IRuntimeOptions extends TConfigOverrides {
  profileRepository?: ProfilesReadPort;
  jobQueue?: JobsQueuePort;
  streamText?: StreamTextPort;
  metrics?: MetricsPort;
}

export type TRequestWithId = Request & { requestId: string };

export interface IServerRuntime {
  app: Express;
  server: THttpServer;
  io: TSocketServer;
  config: IServerConfig;
  metrics: MetricsPort;
  services: {
    profiles: ProfilesReadPort;
    jobs: JobsQueuePort;
  };
  start: () => Promise<void>;
  close: () => Promise<void>;
}

export type { IJobPayload, IListProfilesParams };
