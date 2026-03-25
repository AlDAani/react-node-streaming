import assert from 'node:assert/strict';
import test from 'node:test';
import { ApplicationError, APPLICATION_ERROR_CODES } from '@/application/errors';
import { InMemoryJobsQueueAdapter } from '../../../../../adapters/outbound/in-memory/jobs-queue-adapter';
import { JobsService } from './service';

test('JobsService enqueues and returns jobs', async () => {
  const queue = new InMemoryJobsQueueAdapter({ delayMs: 5 });
  const service = new JobsService(queue, () => false);

  try {
    const job = service.enqueue({ input: 'test job', clientId: 1 });

    assert.equal(job.status, 'pending');
    assert.equal(job.input, 'test job');
    assert.equal(job.clientId, 1);
    assert.equal(service.listJobs(10).length >= 1, true);
  } finally {
    await queue.close();
  }
});

test('JobsService throws JOB_NOT_FOUND for unknown id', async () => {
  const queue = new InMemoryJobsQueueAdapter({ delayMs: 5 });
  const service = new JobsService(queue, () => false);

  try {
    assert.throws(
      () => service.getJob('unknown'),
      (error: unknown) =>
        error instanceof ApplicationError && error.code === APPLICATION_ERROR_CODES.JOB_NOT_FOUND,
    );
  } finally {
    await queue.close();
  }
});

test('JobsService rejects enqueue during shutdown', async () => {
  const queue = new InMemoryJobsQueueAdapter({ delayMs: 5 });
  const service = new JobsService(queue, () => true);

  try {
    assert.throws(
      () => service.enqueue({ input: 'task', clientId: null }),
      (error: unknown) =>
        error instanceof ApplicationError &&
        error.code === APPLICATION_ERROR_CODES.SERVER_SHUTTING_DOWN,
    );
  } finally {
    await queue.close();
  }
});
