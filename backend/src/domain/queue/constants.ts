export const JOB_UPDATED_EVENT = 'job:updated';
export const JOB_ENQUEUED_EVENT = 'job:enqueued';
export const JOB_COMPLETED_EVENT = 'job:completed';
export const JOB_FAILED_EVENT = 'job:failed';
export const QUEUE_REJECTED_EVENT = 'queue:rejected';
export const WORKER_RESTARTED_EVENT = 'worker:restarted';

export const JOB_ID_PREFIX = 'job-';
export const DEFAULT_JOB_DELAY_MS = 2000;
export const DEFAULT_WORKER_CONCURRENCY = 20;

export const WORKER_MESSAGE_TYPES = {
  PROCESS_JOB: 'process-job',
  JOB_PROCESSING: 'job-processing',
  JOB_COMPLETED: 'job-completed',
} as const;

export const JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const TSX_EXEC_ARGV = ['--import', 'tsx'] as const;
