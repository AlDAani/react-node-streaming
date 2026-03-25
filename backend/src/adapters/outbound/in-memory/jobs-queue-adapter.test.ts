import assert from 'node:assert/strict';
import test from 'node:test';
import { JOB_STATUS } from '../../../domain/queue/constants';
import { InMemoryJobsQueueAdapter, resolveInMemoryQueueWorkerRuntime } from './jobs-queue-adapter';

async function waitForJobTerminalState(queue: InMemoryJobsQueueAdapter, jobId: string, timeoutMs = 3000): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const job = queue.getJob(jobId);
    if (job && (job.status === JOB_STATUS.COMPLETED || job.status === JOB_STATUS.FAILED)) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 15));
  }

  throw new Error(`Timed out waiting for job ${jobId}`);
}

test('InMemoryJobQueue enqueues and completes jobs in worker thread', async () => {
  const queue = new InMemoryJobsQueueAdapter({ delayMs: 20 });

  try {
    const job = queue.enqueue('Build dashboard', 1);
    assert.equal(job.status, JOB_STATUS.PENDING);
    assert.equal(job.requestId, job.id);
    assert.equal(job.clientId, 1);

    await waitForJobTerminalState(queue, job.id);

    const completed = queue.getJob(job.id);
    assert.ok(completed);
    assert.equal(completed.status, JOB_STATUS.COMPLETED);
    assert.match(completed.result ?? '', /Completed processing/);
  } finally {
    await queue.close();
  }
});

test('InMemoryJobQueue rejects new jobs once pending queue is full', async () => {
  const queue = new InMemoryJobsQueueAdapter({ delayMs: 500, maxQueueSize: 1, workerConcurrency: 1 });

  try {
    queue.enqueue('first');
    queue.enqueue('second');

    assert.throws(() => {
      queue.enqueue('third');
    }, (error: unknown) => {
      const apiError = error as { code?: string };
      return apiError.code === 'QUEUE_FULL';
    });
  } finally {
    await queue.close();
  }
});

test('InMemoryJobQueue cleans up expired terminal jobs by TTL', async () => {
  const queue = new InMemoryJobsQueueAdapter({
    delayMs: 10,
    jobTtlMs: 30,
    cleanupIntervalMs: 10,
  });

  try {
    const job = queue.enqueue('ttl-job');
    await waitForJobTerminalState(queue, job.id);

    const startedAt = Date.now();
    while (Date.now() - startedAt < 500) {
      const existing = queue.getJob(job.id);
      if (!existing) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    assert.equal(queue.getJob(job.id), null);
  } finally {
    await queue.close();
  }
});

test('InMemoryJobQueue does not accept jobs after close', async () => {
  const queue = new InMemoryJobsQueueAdapter({ delayMs: 20 });

  await queue.close();

  assert.throws(() => {
    queue.enqueue('after-close');
  }, (error: unknown) => {
    const apiError = error as { code?: string };
    return apiError.code === 'SERVER_SHUTTING_DOWN';
  });
});

test('queue worker runtime resolver returns existing worker script', () => {
  const runtime = resolveInMemoryQueueWorkerRuntime();

  assert.equal(runtime.workerReady, true);
  assert.equal(runtime.checkedPaths.length > 0, true);
});

test('InMemoryJobQueue fails fast when worker script path is invalid', () => {
  assert.throws(() => {
    new InMemoryJobsQueueAdapter({
      workerPath: '/tmp/does-not-exist/worker.js',
      workerExecArgv: undefined,
    });
  }, (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    return message.includes('Queue worker script not found');
  });
});
