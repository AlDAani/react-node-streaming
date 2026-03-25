import type { JobsQueuePort } from '../../ports/out';
import { ApplicationError, APPLICATION_ERROR_CODES } from '../../errors';
import type { IJobPayload } from '../../contracts/input';

export class EnqueueJobUseCase {
  constructor(
    private readonly jobs: JobsQueuePort,
    private readonly isShuttingDown: () => boolean,
  ) {}

  execute(payload: IJobPayload) {
    if (this.isShuttingDown()) {
      throw new ApplicationError(
        APPLICATION_ERROR_CODES.SERVER_SHUTTING_DOWN,
        'Server is shutting down and cannot accept new jobs.',
      );
    }

    return this.jobs.enqueue(payload.input, payload.clientId);
  }
}
