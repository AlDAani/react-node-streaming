import { withBaseUrl } from '@/api/constants/base-url';

const EXPECTED_QUEUE_RUNTIME_MARKER = 'presight-backend-queue-runtime-v1';
const PREFLIGHT_TIMEOUT_MS = 4000;

type QueueRuntimePreflightResult = {
  ok: boolean;
  message?: string;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

function buildRuntimeMismatchMessage(observedMarker: string, workerReady: boolean): string {
  return [
    'Queue runtime preflight failed: stale or miswired backend process detected.',
    `Expected runtime marker "${EXPECTED_QUEUE_RUNTIME_MARKER}" but received "${observedMarker || 'missing'}".`,
    `Queue worker readiness reported: ${workerReady ? 'ready' : 'not-ready'}.`,
    'Fix:',
    '1) lsof -ti :4000 | xargs kill',
    '2) pnpm --filter presight-backend start',
  ].join('\n');
}

function buildRuntimeUnavailableMessage(): string {
  return [
    'Queue runtime preflight failed: backend health endpoint is unavailable.',
    'Fix:',
    '1) Ensure backend is running on port 4000',
    '2) pnpm --filter presight-backend start',
  ].join('\n');
}

export async function runQueueRuntimePreflight(): Promise<QueueRuntimePreflightResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, PREFLIGHT_TIMEOUT_MS);

  try {
    const response = await fetch(withBaseUrl('/health'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message: buildRuntimeUnavailableMessage(),
      };
    }

    const payload = await response.json();
    const data = asRecord(asRecord(payload).data);
    const runtime = asRecord(data.runtime);
    const queue = asRecord(runtime.queue);
    const marker = typeof runtime.buildMarker === 'string' ? runtime.buildMarker : '';
    const workerReady = queue.workerReady === true;

    if (marker !== EXPECTED_QUEUE_RUNTIME_MARKER || !workerReady) {
      return {
        ok: false,
        message: buildRuntimeMismatchMessage(marker, workerReady),
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message: buildRuntimeUnavailableMessage(),
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export { EXPECTED_QUEUE_RUNTIME_MARKER };
