export interface IServerConfig {
  appName: string;
  port: number;
  corsOrigins: string[];
  pageSizeDefault: number;
  pageSizeMax: number;
  jobDelayMs: number;
  queueWorkerConcurrency: number;
  maxQueueSize: number;
  maxStoredJobs: number;
  jobTtlMs: number;
  jobCleanupIntervalMs: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  shutdownGraceMs: number;
}

export type TConfigOverrides = Partial<IServerConfig>;
