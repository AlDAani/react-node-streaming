export const METRIC_NAMES = {
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION_MS: 'http_request_duration_ms',
  QUEUE_DEPTH: 'queue_depth',
  QUEUE_JOBS_TOTAL: 'queue_jobs_total',
  QUEUE_JOBS_COMPLETED_TOTAL: 'queue_jobs_completed_total',
  QUEUE_JOBS_FAILED_TOTAL: 'queue_jobs_failed_total',
  QUEUE_REJECTED_TOTAL: 'queue_rejected_total',
  WORKER_RESTARTS_TOTAL: 'worker_restarts_total',
  SOCKET_CONNECTIONS_CURRENT: 'socket_connections_current',
} as const;
