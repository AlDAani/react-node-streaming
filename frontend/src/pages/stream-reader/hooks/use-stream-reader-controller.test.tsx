import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { OpenStreamTextParams, StreamEvent } from '@/api/stream';
import { useStreamReaderController } from './use-stream-reader-controller';

type OpenStreamFn = (params: OpenStreamTextParams) => Promise<void>;

type HarnessProps = {
  openStream: OpenStreamFn;
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const Harness = ({ openStream }: HarnessProps) => {
  const { status, displayedText, errorMessage, start, stop } = useStreamReaderController({
    openStream,
  });

  return (
    <div>
      <button data-testid="start" type="button" onClick={() => void start()}>
        start
      </button>
      <button data-testid="stop" type="button" onClick={stop}>
        stop
      </button>
      <div data-testid="status">{status}</div>
      <div data-testid="text">{displayedText}</div>
      <div data-testid="error">{errorMessage ?? ''}</div>
    </div>
  );
};

describe('useStreamReaderController', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
      (callback: FrameRequestCallback) => {
        queueMicrotask(() => callback(performance.now()));
        return 1;
      },
    );

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders progressive output while stream is still open', async () => {
    let emit: ((event: StreamEvent) => void) | null = null;
    let finish: (() => void) | null = null;

    const openStream = vi.fn(
      async ({ onEvent }: OpenStreamTextParams) =>
        new Promise<void>((resolve) => {
          emit = onEvent;
          finish = resolve;
        }),
    );

    render(<Harness openStream={openStream} />);
    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => {
      expect(openStream).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('status').textContent).toBe('connecting');

    if (!emit || !finish) {
      throw new Error('Stream hooks are not initialized.');
    }

    const emitEvent: (event: StreamEvent) => void = emit;
    const finishStream: () => void = finish;

    act(() => {
      emitEvent({ type: 'delta', delta: 'Hello' });
    });

    await act(async () => {
      await flushMicrotasks();
    });

    expect(screen.getByTestId('status').textContent).toBe('streaming');
    expect(screen.getByTestId('text').textContent).toBe('Hello');

    act(() => {
      emitEvent({ type: 'delta', delta: ' world' });
      emitEvent({ type: 'done' });
      finishStream();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('done');
    });

    expect(screen.getByTestId('text').textContent).toBe('Hello world');
  });

  it('preserves partial output when stream is stopped', async () => {
    let emit: ((event: StreamEvent) => void) | null = null;

    const openStream = vi.fn(async ({ onEvent, signal }: OpenStreamTextParams) => {
      emit = onEvent;

      await new Promise<void>((resolve) => {
        signal?.addEventListener('abort', () => resolve(), { once: true });
      });
    });

    render(<Harness openStream={openStream} />);
    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => {
      expect(openStream).toHaveBeenCalledTimes(1);
    });

    if (!emit) {
      throw new Error('Stream emitter is not ready.');
    }

    const emitEvent: (event: StreamEvent) => void = emit;

    act(() => {
      emitEvent({ type: 'delta', delta: 'Partial text' });
    });

    await act(async () => {
      await flushMicrotasks();
    });

    expect(screen.getByTestId('text').textContent).toBe('Partial text');

    fireEvent.click(screen.getByTestId('stop'));

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('stopped');
    });

    expect(screen.getByTestId('text').textContent).toBe('Partial text');
  });

  it('types streamed content character by character and completes with full output', async () => {
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    let emit: ((event: StreamEvent) => void) | null = null;
    let finish: (() => void) | null = null;

    const openStream = vi.fn(
      async ({ onEvent }: OpenStreamTextParams) =>
        new Promise<void>((resolve) => {
          emit = onEvent;
          finish = resolve;
        }),
    );

    render(<Harness openStream={openStream} />);
    fireEvent.click(screen.getByTestId('start'));

    await waitFor(() => {
      expect(openStream).toHaveBeenCalledTimes(1);
    });

    if (!emit || !finish) {
      throw new Error('Stream hooks are not initialized.');
    }

    const emitEvent: (event: StreamEvent) => void = emit;
    const finishStream: () => void = finish;

    act(() => {
      emitEvent({ type: 'delta', delta: 'streaming' });
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('streaming');
    });

    expect(screen.getByTestId('text').textContent).toBe('streaming');
    expect(rafSpy.mock.calls.length).toBeGreaterThan(1);

    act(() => {
      emitEvent({ type: 'done' });
      finishStream();
    });

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('done');
    });
  });
});
