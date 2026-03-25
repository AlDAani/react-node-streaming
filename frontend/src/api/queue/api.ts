import { baseApi } from '@/api/base/base-api';
import { withBaseUrl } from '@/api/constants/base-url';
import {
  normalizeQueueJobResponse,
  normalizeQueueSocketEvent,
  sanitizeQueueError,
} from './normalizers';
import type { QueueJobResponse, QueueResultEvent } from './types';

type CreateQueueJobBody = {
  clientId: number;
};

const getEnvelopeErrorMessage = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const error = record.error;

  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const errorRecord = error as Record<string, unknown>;

  return typeof errorRecord.message === 'string' ? errorRecord.message : null;
};

export const fetchQueueJobById = async (requestId: string): Promise<QueueResultEvent | null> => {
  const normalizedRequestId = requestId.trim();

  if (!normalizedRequestId) {
    return null;
  }

  let response: Response;

  try {
    response = await fetch(withBaseUrl(`/api/jobs/${encodeURIComponent(normalizedRequestId)}`), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  } catch {
    return {
      requestId: normalizedRequestId,
      status: 'error',
      error: 'Network error while polling queue result.',
    };
  }

  let payload: unknown = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = getEnvelopeErrorMessage(payload);

    return {
      requestId: normalizedRequestId,
      status: 'error',
      error: sanitizeQueueError(message || `Polling failed with status ${response.status}.`),
    };
  }

  return (
    normalizeQueueSocketEvent(payload) ?? {
      requestId: normalizedRequestId,
      status: 'pending',
    }
  );
};

export const queueApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    createQueueJob: build.mutation<QueueJobResponse, CreateQueueJobBody>({
      query: (body) => ({
        url: '/api/jobs',
        method: 'POST',
        body: {
          input: `Client ${body.clientId}`,
        },
      }),
      transformResponse: (payload: unknown) => normalizeQueueJobResponse(payload),
      invalidatesTags: [{ type: 'QueueJobs', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const { useCreateQueueJobMutation } = queueApi;
