import { withBaseUrl } from '@/api/constants/base-url';
import { buildApiError } from '@/api/utils/api-error';
import type { EventSourceFactory, OpenStreamTextParams } from './types';

const DEFAULT_STREAM_ENDPOINT = '/api/stream-text';
const DEFAULT_SERVER_ERROR_MESSAGE = 'Stream failed.';

const defaultEventSourceFactory: EventSourceFactory = (url, init) => new EventSource(url, init);

const emitNetworkError = (onEvent: OpenStreamTextParams['onEvent']) => {
  onEvent({
    type: 'error',
    error: buildApiError('streamFailed', 0),
  });
};

const parseJsonRecord = (value: string): Record<string, unknown> | null => {
  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const emitServerError = (
  onEvent: OpenStreamTextParams['onEvent'],
  message: string = DEFAULT_SERVER_ERROR_MESSAGE,
) => {
  onEvent({
    type: 'error',
    error: {
      status: 500,
      code: 'unknown',
      message,
    },
  });
};

export const openStreamText = ({
  signal,
  onEvent,
  endpoint = DEFAULT_STREAM_ENDPOINT,
  eventSourceFactory = defaultEventSourceFactory,
}: OpenStreamTextParams): Promise<void> =>
  new Promise((resolve) => {
    let source: ReturnType<EventSourceFactory>;

    try {
      source = eventSourceFactory(withBaseUrl(endpoint));
    } catch {
      emitNetworkError(onEvent);
      resolve();
      return;
    }

    let isSettled = false;

    const cleanup = () => {
      source.removeEventListener('delta', handleDelta);
      source.removeEventListener('done', handleDone);
      source.removeEventListener('server-error', handleServerError);
      source.removeEventListener('error', handleNetworkFailure);
      signal?.removeEventListener('abort', handleAbort);
    };

    const settle = () => {
      if (isSettled) {
        return;
      }

      isSettled = true;
      cleanup();
      resolve();
    };

    const closeSource = () => {
      source.close();
    };

    const handleAbort = () => {
      closeSource();
      settle();
    };

    const handleDelta = (event: Event | MessageEvent<string>) => {
      const messageEvent = event as MessageEvent<string>;
      const payload = parseJsonRecord(messageEvent.data);
      const delta =
        typeof payload?.delta === 'string'
          ? payload.delta
          : typeof messageEvent.data === 'string'
            ? messageEvent.data
            : '';

      if (!delta) {
        return;
      }

      onEvent({
        type: 'delta',
        delta,
      });
    };

    const handleDone = () => {
      onEvent({
        type: 'done',
      });
      closeSource();
      settle();
    };

    const handleServerError = (event: Event | MessageEvent<string>) => {
      if (signal?.aborted) {
        closeSource();
        settle();
        return;
      }

      const messageEvent = event as MessageEvent<string>;
      const payload = parseJsonRecord(messageEvent.data);
      const message =
        typeof payload?.message === 'string' && payload.message.trim().length > 0
          ? payload.message
          : DEFAULT_SERVER_ERROR_MESSAGE;

      emitServerError(onEvent, message);
      closeSource();
      settle();
    };

    const handleNetworkFailure = () => {
      if (signal?.aborted) {
        closeSource();
        settle();
        return;
      }

      emitNetworkError(onEvent);
      closeSource();
      settle();
    };

    source.addEventListener('delta', handleDelta);
    source.addEventListener('done', handleDone);
    source.addEventListener('server-error', handleServerError);
    source.addEventListener('error', handleNetworkFailure);

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
