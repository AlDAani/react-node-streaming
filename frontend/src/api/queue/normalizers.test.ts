import { describe, expect, test } from 'vitest';
import {
  normalizeQueueJobResponse,
  normalizeQueueSocketEvent,
  sanitizeQueueError,
} from './normalizers';

describe('queue normalizers', () => {
  test('sanitizeQueueError maps backend module-resolution error to user-safe message', () => {
    expect(
      sanitizeQueueError(
        "Cannot find module '/Users/dan/work/presight-execise/backend/src/queue/constants' imported from /Users/dan/work/presight-execise/backend/src/queue/worker.ts",
      ),
    ).toBe('Backend queue worker is unavailable.');
  });

  test('normalizeQueueJobResponse returns sanitized error and normalized status', () => {
    const normalized = normalizeQueueJobResponse({
      data: {
        id: 'job-0001',
        status: 'failed',
        error:
          "Cannot find module '/Users/dan/work/presight-execise/backend/src/queue/constants' imported from /Users/dan/work/presight-execise/backend/src/queue/worker.ts",
      },
    });

    expect(normalized).toEqual({
      requestId: 'job-0001',
      status: 'error',
      error: 'Backend queue worker is unavailable.',
      result: undefined,
    });
  });

  test('normalizeQueueSocketEvent supports legacy wrapped payload', () => {
    const normalized = normalizeQueueSocketEvent({
      data: {
        requestId: 'job-0002',
        status: 'completed',
        result: 'Done',
      },
    });

    expect(normalized).toEqual({
      requestId: 'job-0002',
      status: 'done',
      result: 'Done',
      error: undefined,
    });
  });
});
