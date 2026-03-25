import type { IQueueJob, IQueueSnapshot } from '../../../domain/queue';

export type TJobsQueueEventName =
  | 'job:updated'
  | 'job:enqueued'
  | 'job:completed'
  | 'job:failed'
  | 'queue:rejected'
  | 'worker:restarted';

export interface JobsQueuePort {
  enqueue(input: string, clientId?: number | null): IQueueJob;
  getJob(jobId: string): IQueueJob | null;
  listJobs(limit?: number): IQueueJob[];
  getSnapshot(): IQueueSnapshot;
  stopAccepting(): void;
  close(graceMs?: number): Promise<void>;
  on(event: TJobsQueueEventName, listener: (...args: unknown[]) => void): this;
  off(event: TJobsQueueEventName, listener: (...args: unknown[]) => void): this;
}
