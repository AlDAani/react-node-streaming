import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXPECTED_QUEUE_RUNTIME_MARKER, runQueueRuntimePreflight } from './runtime-preflight';

const fetchMock = vi.fn();

describe('runQueueRuntimePreflight', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns ok=true when backend reports expected marker and worker readiness', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            runtime: {
              buildMarker: EXPECTED_QUEUE_RUNTIME_MARKER,
              queue: {
                workerReady: true,
              },
            },
          },
        }),
        { status: 200 },
      ),
    );

    const result = await runQueueRuntimePreflight();
    expect(result).toEqual({ ok: true });
  });

  it('returns mismatch message when worker is not ready', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            runtime: {
              buildMarker: EXPECTED_QUEUE_RUNTIME_MARKER,
              queue: {
                workerReady: false,
              },
            },
          },
        }),
        { status: 200 },
      ),
    );

    const result = await runQueueRuntimePreflight();
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Queue runtime preflight failed');
  });

  it('returns unavailable message when health endpoint call fails', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const result = await runQueueRuntimePreflight();
    expect(result.ok).toBe(false);
    expect(result.message).toContain('health endpoint is unavailable');
  });
});
