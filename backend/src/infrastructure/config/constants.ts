export const APP_NAME = 'presight-backend';
export const DEFAULT_PORT = 4000;
export const DEFAULT_CORS_ORIGINS = ['http://localhost:5173'] as const;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export const DEFAULT_JOB_DELAY_MS = 2000;
export const DEFAULT_QUEUE_WORKER_CONCURRENCY = 20;
export const DEFAULT_MAX_QUEUE_SIZE = 500;
export const DEFAULT_MAX_STORED_JOBS = 2000;
export const DEFAULT_JOB_TTL_MS = 1_800_000;
export const DEFAULT_JOB_CLEANUP_INTERVAL_MS = 60_000;

export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
export const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 30;

export const DEFAULT_SHUTDOWN_GRACE_MS = 10_000;
