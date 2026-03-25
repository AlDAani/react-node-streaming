import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STREAM_READER_TRANSLATIONS } from '@/constants/i18next/stream-reader-translations';

type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'stopped' | 'done' | 'error';

const useStreamReaderControllerMock = vi.fn();

vi.mock('./hooks/use-stream-reader-controller', () => ({
  useStreamReaderController: () => useStreamReaderControllerMock(),
}));

vi.mock('i18next', () => ({
  default: {
    t: (key: string) => key,
  },
}));

import { StreamReaderPage } from './index';

const STREAM_STATUS_TRANSLATIONS: Record<StreamStatus, string> = {
  idle: STREAM_READER_TRANSLATIONS.idle,
  connecting: STREAM_READER_TRANSLATIONS.connecting,
  streaming: STREAM_READER_TRANSLATIONS.streaming,
  stopped: STREAM_READER_TRANSLATIONS.stopped,
  done: STREAM_READER_TRANSLATIONS.done,
  error: STREAM_READER_TRANSLATIONS.error,
};

const makeControllerState = (
  status: StreamStatus,
  overrides?: Partial<{ errorMessage: string | null }>,
) => ({
  status,
  displayedText: 'stream output',
  errorMessage: overrides?.errorMessage ?? null,
  isComplete: status === 'done',
  start: vi.fn(async () => undefined),
  stop: vi.fn(),
});

describe('StreamReaderPage', () => {
  beforeEach(() => {
    useStreamReaderControllerMock.mockReset();

    class ResizeObserverMock {
      observe() {}

      unobserve() {}

      disconnect() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['idle', false, true],
    ['connecting', true, false],
    ['streaming', true, false],
    ['stopped', false, true],
    ['done', false, true],
    ['error', false, true],
  ] as const)(
    'applies correct start/stop disabled states for status=%s',
    (status, expectedStartDisabled, expectedStopDisabled) => {
      useStreamReaderControllerMock.mockReturnValue(makeControllerState(status));

      render(<StreamReaderPage />);

      const startButton = screen.getByRole('button', {
        name: STREAM_READER_TRANSLATIONS.start,
      }) as HTMLButtonElement;
      const stopButton = screen.getByRole('button', {
        name: STREAM_READER_TRANSLATIONS.stop,
      }) as HTMLButtonElement;

      expect(startButton.disabled).toBe(expectedStartDisabled);
      expect(stopButton.disabled).toBe(expectedStopDisabled);
    },
  );

  it.each(['idle', 'connecting', 'streaming', 'stopped', 'done', 'error'] as const)(
    'renders status badge text for status=%s',
    (status) => {
      useStreamReaderControllerMock.mockReturnValue(makeControllerState(status));

      render(<StreamReaderPage />);

      expect(screen.getByText(STREAM_STATUS_TRANSLATIONS[status])).not.toBeNull();
    },
  );

  it('renders error callout only when status is error', () => {
    useStreamReaderControllerMock.mockReturnValue(
      makeControllerState('error', { errorMessage: 'Stream failed' }),
    );

    render(<StreamReaderPage />);

    const errorText = screen.getByText('Stream failed');
    expect(errorText.closest('.rt-CalloutRoot')).not.toBeNull();
  });

  it('does not render error callout when status is not error', () => {
    useStreamReaderControllerMock.mockReturnValue(
      makeControllerState('streaming', { errorMessage: 'hidden error' }),
    );

    render(<StreamReaderPage />);

    expect(screen.queryByText('hidden error')).toBeNull();
  });
});
