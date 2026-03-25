import {
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';
import { METRIC_NAMES } from './constants';
import { IHttpMetricInput, IMetricsService } from './types';

export class MetricsService implements IMetricsService {
  private registry: Registry;

  private httpRequestsTotal: Counter<'method' | 'route' | 'status_code'>;

  private httpRequestDurationMs: Histogram<'method' | 'route' | 'status_code'>;

  private queueDepth: Gauge;

  private queueJobsTotal: Counter;

  private queueJobsCompletedTotal: Counter;

  private queueJobsFailedTotal: Counter;

  private queueRejectedTotal: Counter;

  private workerRestartsTotal: Counter;

  private socketConnectionsCurrent: Gauge;

  public contentType: string;

  constructor() {
    this.registry = new Registry();
    this.contentType = this.registry.contentType;

    this.httpRequestsTotal = new Counter({
      name: METRIC_NAMES.HTTP_REQUESTS_TOTAL,
      help: 'Total number of HTTP requests.',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestDurationMs = new Histogram({
      name: METRIC_NAMES.HTTP_REQUEST_DURATION_MS,
      help: 'HTTP request duration in milliseconds.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [5, 15, 30, 60, 120, 250, 500, 1000, 2000],
      registers: [this.registry],
    });

    this.queueDepth = new Gauge({
      name: METRIC_NAMES.QUEUE_DEPTH,
      help: 'Current amount of pending queue jobs.',
      registers: [this.registry],
    });

    this.queueJobsTotal = new Counter({
      name: METRIC_NAMES.QUEUE_JOBS_TOTAL,
      help: 'Total accepted queue jobs.',
      registers: [this.registry],
    });

    this.queueJobsCompletedTotal = new Counter({
      name: METRIC_NAMES.QUEUE_JOBS_COMPLETED_TOTAL,
      help: 'Total completed queue jobs.',
      registers: [this.registry],
    });

    this.queueJobsFailedTotal = new Counter({
      name: METRIC_NAMES.QUEUE_JOBS_FAILED_TOTAL,
      help: 'Total failed queue jobs.',
      registers: [this.registry],
    });

    this.queueRejectedTotal = new Counter({
      name: METRIC_NAMES.QUEUE_REJECTED_TOTAL,
      help: 'Total queue job rejections.',
      registers: [this.registry],
    });

    this.workerRestartsTotal = new Counter({
      name: METRIC_NAMES.WORKER_RESTARTS_TOTAL,
      help: 'Total worker restarts after worker failure.',
      registers: [this.registry],
    });

    this.socketConnectionsCurrent = new Gauge({
      name: METRIC_NAMES.SOCKET_CONNECTIONS_CURRENT,
      help: 'Current number of active socket connections.',
      registers: [this.registry],
    });
  }

  observeHttp({ method, route, statusCode, durationMs }: IHttpMetricInput): void {
    const labels = {
      method: method.toUpperCase(),
      route,
      status_code: String(statusCode),
    } as const;

    this.httpRequestsTotal.inc(labels);
    this.httpRequestDurationMs.observe(labels, durationMs);
  }

  setQueueDepth(depth: number): void {
    this.queueDepth.set(Math.max(depth, 0));
  }

  incQueueJobsTotal(): void {
    this.queueJobsTotal.inc();
  }

  incQueueJobsCompletedTotal(): void {
    this.queueJobsCompletedTotal.inc();
  }

  incQueueJobsFailedTotal(): void {
    this.queueJobsFailedTotal.inc();
  }

  incQueueRejectedTotal(): void {
    this.queueRejectedTotal.inc();
  }

  incWorkerRestartsTotal(): void {
    this.workerRestartsTotal.inc();
  }

  setSocketConnectionsCurrent(count: number): void {
    this.socketConnectionsCurrent.set(Math.max(count, 0));
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }
}

export type { IHttpMetricInput, IMetricsService } from './types';
