export interface IHttpMetricInput {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
}

export interface MetricsPort {
  observeHttp(input: IHttpMetricInput): void;
  setQueueDepth(depth: number): void;
  incQueueJobsTotal(): void;
  incQueueJobsCompletedTotal(): void;
  incQueueJobsFailedTotal(): void;
  incQueueRejectedTotal(): void;
  incWorkerRestartsTotal(): void;
  setSocketConnectionsCurrent(count: number): void;
  metrics(): Promise<string>;
  contentType: string;
}
