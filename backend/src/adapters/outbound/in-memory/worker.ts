import { parentPort } from 'node:worker_threads';
import { WORKER_MESSAGE_TYPES } from '../../../domain/queue/constants';
import type { IWorkerProcessJobMessage } from '../../../domain/queue/types';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const workerPort = parentPort;

if (workerPort) {
  workerPort.on('message', async (message: IWorkerProcessJobMessage) => {
    if (!message || message.type !== WORKER_MESSAGE_TYPES.PROCESS_JOB) {
      return;
    }

    const { jobId, input, delayMs } = message;

    workerPort.postMessage({
      type: WORKER_MESSAGE_TYPES.JOB_PROCESSING,
      jobId,
    });

    await wait(delayMs);

    workerPort.postMessage({
      type: WORKER_MESSAGE_TYPES.JOB_COMPLETED,
      jobId,
      result: `Completed processing for "${input}"`,
    });
  });
}
