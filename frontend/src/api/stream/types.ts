import type { ApiBaseError } from '@/api/types/api-error';

export type StreamEvent =
  | {
      type: 'delta';
      delta: string;
    }
  | {
      type: 'done';
    }
  | {
      type: 'error';
      error: ApiBaseError;
    };

export type EventSourceListener = (event: Event | MessageEvent<string>) => void;

export type EventSourceLike = {
  addEventListener: (type: string, listener: EventSourceListener) => void;
  removeEventListener: (type: string, listener: EventSourceListener) => void;
  close: () => void;
};

export type EventSourceFactory = (url: string, init?: EventSourceInit) => EventSourceLike;

export type OpenStreamTextParams = {
  signal?: AbortSignal;
  endpoint?: string;
  eventSourceFactory?: EventSourceFactory;
  onEvent: (event: StreamEvent) => void;
};
