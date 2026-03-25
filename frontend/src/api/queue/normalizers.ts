import type { QueueJobResponse, QueueResultEvent } from './types';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const asQueueStatus = (value: unknown): QueueJobResponse['status'] => {
  if (value === 'completed' || value === 'done') {
    return 'done';
  }

  if (value === 'failed' || value === 'error') {
    return 'error';
  }

  return 'pending';
};

export const sanitizeQueueError = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const message = value.trim();

  if (!message) {
    return undefined;
  }

  if (message.includes('Cannot find module')) {
    return 'Backend queue worker is unavailable.';
  }

  if (message.includes('Queue stopped before job completion')) {
    return 'Queue stopped before completing this request.';
  }

  if (message.includes('Queue is full')) {
    return 'Queue is full. Please retry shortly.';
  }

  return message;
};

export const normalizeQueueJobResponse = (payload: unknown): QueueJobResponse => {
  const rootRecord = asRecord(payload);
  const record = asRecord(rootRecord.data);
  const fallbackRecord = Object.keys(record).length > 0 ? record : rootRecord;

  return {
    requestId: String(fallbackRecord.requestId ?? fallbackRecord.id ?? ''),
    status: asQueueStatus(fallbackRecord.status),
    result: typeof fallbackRecord.result === 'string' ? fallbackRecord.result : undefined,
    error: sanitizeQueueError(fallbackRecord.error),
  };
};

export const normalizeQueueSocketEvent = (payload: unknown): QueueResultEvent | null => {
  const rootRecord = asRecord(payload);
  const record = asRecord(rootRecord.data);
  const fallbackRecord = Object.keys(record).length > 0 ? record : rootRecord;
  const requestId = String(fallbackRecord.requestId ?? fallbackRecord.id ?? '').trim();

  if (!requestId) {
    return null;
  }

  return {
    requestId,
    status: asQueueStatus(fallbackRecord.status),
    result: typeof fallbackRecord.result === 'string' ? fallbackRecord.result : undefined,
    error: sanitizeQueueError(fallbackRecord.error),
  };
};
