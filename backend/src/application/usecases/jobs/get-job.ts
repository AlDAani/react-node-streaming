import type { JobsQueuePort } from '../../ports/out';
import { ApplicationError, APPLICATION_ERROR_CODES } from '../../errors';

export class GetJobUseCase {
  constructor(private readonly jobs: JobsQueuePort) {}

  execute(jobId: string) {
    const job = this.jobs.getJob(jobId);

    if (!job) {
      throw new ApplicationError(APPLICATION_ERROR_CODES.JOB_NOT_FOUND, 'Job was not found.');
    }

    return job;
  }
}
