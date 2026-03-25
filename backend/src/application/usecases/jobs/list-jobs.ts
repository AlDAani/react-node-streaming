import type { JobsQueuePort } from '../../ports/out';

export class ListJobsUseCase {
  constructor(private readonly jobs: JobsQueuePort) {}

  execute(limit: number) {
    return this.jobs.listJobs(limit);
  }
}
