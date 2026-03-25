import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueueResultEvent } from '@/api/queue';
import { QUEUE_WORKER_TRANSLATIONS } from './constants/translations';

const connectQueueSocketMock = vi.fn();
const fetchQueueJobByIdMock = vi.fn();
const runQueueRuntimePreflightMock = vi.fn();
const createQueueJobMock = vi.fn();
const socketDisconnectMock = vi.fn();

type QueueSocketCallbacks = {
  onConnectionStateChange?: (state: 'connected' | 'disconnected' | 'reconnecting') => void;
  onQueueResult?: (payload: QueueResultEvent) => void;
};

let latestSocketCallbacks: QueueSocketCallbacks | null = null;

vi.mock('i18next', () => ({
  default: {
    t: (key: string) => key,
  },
}));

vi.mock('@/api/queue', () => ({
  connectQueueSocket: (callbacks: QueueSocketCallbacks) => connectQueueSocketMock(callbacks),
  fetchQueueJobById: (requestId: string) => fetchQueueJobByIdMock(requestId),
  runQueueRuntimePreflight: () => runQueueRuntimePreflightMock(),
  useCreateQueueJobMutation: () => [createQueueJobMock],
}));

import { QueueWorkerPage } from './index';

describe('QueueWorkerPage', () => {
  beforeEach(() => {
    vi.useRealTimers();
    latestSocketCallbacks = null;

    connectQueueSocketMock.mockReset();
    fetchQueueJobByIdMock.mockReset();
    runQueueRuntimePreflightMock.mockReset();
    createQueueJobMock.mockReset();
    socketDisconnectMock.mockReset();

    runQueueRuntimePreflightMock.mockResolvedValue({ ok: true });
    fetchQueueJobByIdMock.mockResolvedValue(null);
    createQueueJobMock.mockImplementation(({ clientId }: { clientId: number }) => ({
      unwrap: async () => ({
        requestId: `job-${clientId}`,
        status: 'pending',
      }),
    }));
    connectQueueSocketMock.mockImplementation((callbacks: QueueSocketCallbacks) => {
      latestSocketCallbacks = callbacks;
      callbacks.onConnectionStateChange?.('connected');

      return {
        disconnect: socketDisconnectMock,
      };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses websocket updates in connected mode and does not poll in parallel', async () => {
    render(<QueueWorkerPage />);

    const runButton = screen.getByRole('button', { name: QUEUE_WORKER_TRANSLATIONS.runBatch });
    await waitFor(() => {
      expect((runButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(runButton);

    await waitFor(() => {
      expect(createQueueJobMock).toHaveBeenCalledTimes(20);
    });

    await act(async () => {
      latestSocketCallbacks?.onQueueResult?.({
        requestId: 'job-1',
        status: 'done',
        result: 'socket-result-1',
      });
    });

    expect(screen.getByText('socket-result-1')).not.toBeNull();
    expect(fetchQueueJobByIdMock).not.toHaveBeenCalled();
  });

  it('uses polling fallback when socket is disconnected', async () => {
    connectQueueSocketMock.mockImplementation((callbacks: QueueSocketCallbacks) => {
      latestSocketCallbacks = callbacks;
      callbacks.onConnectionStateChange?.('disconnected');

      return {
        disconnect: socketDisconnectMock,
      };
    });

    fetchQueueJobByIdMock.mockImplementation(async (requestId: string) => {
      if (requestId === 'job-1') {
        return {
          requestId,
          status: 'done',
          result: 'polled-result-1',
        };
      }

      return {
        requestId,
        status: 'pending',
      };
    });

    render(<QueueWorkerPage />);

    const runButton = screen.getByRole('button', { name: QUEUE_WORKER_TRANSLATIONS.runBatch });
    await waitFor(() => {
      expect((runButton as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(runButton);

    await waitFor(() => {
      expect(fetchQueueJobByIdMock).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('polled-result-1')).not.toBeNull();
    });
  });

  it('shows watchdog warning when connected but queue updates stall', async () => {
    vi.useFakeTimers();

    render(<QueueWorkerPage />);

    const runButton = screen.getByRole('button', { name: QUEUE_WORKER_TRANSLATIONS.runBatch });

    await act(async () => {
      await Promise.resolve();
    });
    expect((runButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(runButton);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(createQueueJobMock).toHaveBeenCalledTimes(20);

    await act(async () => {
      vi.advanceTimersByTime(7500);
    });

    expect(screen.getByText(QUEUE_WORKER_TRANSLATIONS.socketWatchdogWarning)).not.toBeNull();
  });

  it('blocks batch run when runtime preflight fails', async () => {
    runQueueRuntimePreflightMock.mockResolvedValue({
      ok: false,
      message: 'Queue runtime preflight failed: stale backend',
    });

    render(<QueueWorkerPage />);

    await waitFor(() => {
      expect(screen.getByText('Queue runtime preflight failed: stale backend')).not.toBeNull();
    });

    const runButton = screen.getByRole('button', { name: QUEUE_WORKER_TRANSLATIONS.runBatch });
    expect((runButton as HTMLButtonElement).disabled).toBe(true);
  });
});
