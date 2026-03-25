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

export type OpenStreamTextParams = {
  signal?: AbortSignal;
  endpoint?: string;
  fetchImpl?: typeof fetch;
  onEvent: (event: StreamEvent) => void;
};
