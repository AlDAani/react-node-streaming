import { withBaseUrl } from '@/api/constants/base-url';
import { buildApiError, mapStatusCodeToErrorCode } from '@/api/utils/api-error';
import type { OpenStreamTextParams } from './types';

const DEFAULT_STREAM_ENDPOINT = '/api/stream-text';

const emitNetworkError = (onEvent: OpenStreamTextParams['onEvent']) => {
  onEvent({
    type: 'error',
    error: buildApiError('streamFailed', 0),
  });
};

export const openStreamText = async ({
  signal,
  onEvent,
  endpoint = DEFAULT_STREAM_ENDPOINT,
  fetchImpl = fetch,
}: OpenStreamTextParams): Promise<void> => {
  let response: Response;

  try {
    response = await fetchImpl(withBaseUrl(endpoint), {
      method: 'GET',
      signal,
    });
  } catch {
    if (signal?.aborted) {
      return;
    }

    emitNetworkError(onEvent);
    return;
  }

  if (!response.ok) {
    onEvent({
      type: 'error',
      error: buildApiError(mapStatusCodeToErrorCode(response.status), response.status),
    });
    return;
  }

  if (!response.body) {
    onEvent({
      type: 'error',
      error: buildApiError('streamFailed', response.status || 500),
    });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      if (!value || value.length === 0) {
        continue;
      }

      const delta = decoder.decode(value, { stream: true });

      if (delta) {
        onEvent({
          type: 'delta',
          delta,
        });
      }
    }

    const finalDelta = decoder.decode();

    if (finalDelta) {
      onEvent({
        type: 'delta',
        delta: finalDelta,
      });
    }

    onEvent({
      type: 'done',
    });
  } catch {
    if (signal?.aborted) {
      return;
    }

    emitNetworkError(onEvent);
  } finally {
    reader.releaseLock();
  }
};
