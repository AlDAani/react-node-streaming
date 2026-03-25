import type { JobsQueuePort } from '@/application/ports/out';
import { EnqueueJobUseCase } from '@/application/usecases/jobs/enqueue-job';
import { GetJobUseCase } from '@/application/usecases/jobs/get-job';
import { ListJobsUseCase } from '@/application/usecases/jobs/list-jobs';
import type { IJobPayload } from './schemas';

export class JobsService {
  private readonly listJobsUseCase: ListJobsUseCase;

  private readonly getJobUseCase: GetJobUseCase;

  private readonly enqueueJobUseCase: EnqueueJobUseCase;

  constructor(
    jobs: JobsQueuePort,
    isShuttingDown: () => boolean,
  ) {
    this.listJobsUseCase = new ListJobsUseCase(jobs);
    this.getJobUseCase = new GetJobUseCase(jobs);
    this.enqueueJobUseCase = new EnqueueJobUseCase(jobs, isShuttingDown);
  }

  listJobs(limit: number) {
    return this.listJobsUseCase.execute(limit);
  }

  getJob(jobId: string) {
    return this.getJobUseCase.execute(jobId);
  }

  enqueue(payload: IJobPayload) {
    return this.enqueueJobUseCase.execute(payload);
  }
}
