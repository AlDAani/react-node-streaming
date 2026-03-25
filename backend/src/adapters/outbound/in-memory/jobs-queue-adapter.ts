import {
  InMemoryJobQueue,
  resolveInMemoryQueueWorkerRuntime,
  type InMemoryQueueWorkerRuntimeResolution,
} from './in-memory-jobs-queue';

export class InMemoryJobsQueueAdapter extends InMemoryJobQueue {}

export { resolveInMemoryQueueWorkerRuntime };
export type { InMemoryQueueWorkerRuntimeResolution };
