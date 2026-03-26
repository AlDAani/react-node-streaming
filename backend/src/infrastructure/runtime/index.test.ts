import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { io as createSocketClient, Socket } from 'socket.io-client';
import { API_ROUTES } from '../../adapters/inbound/http/contracts';
import { SOCKET_EVENTS } from '../../adapters/inbound/socket/contracts';
import { METRIC_NAMES } from '../metrics/constants';
import { createServerRuntime } from './index';

async function startRuntime(overrides: Record<string, unknown> = {}) {
  const runtime = createServerRuntime({
    port: 0,
    jobDelayMs: 25,
    ...overrides,
  });

  await runtime.start();

  const address = runtime.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    runtime,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

test('health endpoint reports core status', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    const response = await fetch(`${baseUrl}${API_ROUTES.HEALTH}`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.data.status, 'ok');
    assert.equal(payload.data.profilesCount > 0, true);
    assert.equal(payload.data.runtime.buildMarker, 'presight-backend-queue-runtime-v1');
    assert.equal(typeof payload.data.runtime.queue.workerReady, 'boolean');
    assert.equal(typeof payload.data.runtime.queue.workerPath, 'string');
    assert.equal(typeof payload.meta.requestId, 'string');
  } finally {
    await runtime.close();
  }
});

test('runtime fails fast when queue worker script cannot be resolved', () => {
  const originalExistsSync = fs.existsSync;
  fs.existsSync = (() => false) as typeof fs.existsSync;

  try {
    assert.throws(() => {
      createServerRuntime({ port: 0 });
    }, (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      return message.includes('Queue worker runtime is not ready');
    });
  } finally {
    fs.existsSync = originalExistsSync;
  }
});

test('profiles endpoint supports search and pagination', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    const response = await fetch(`${baseUrl}${API_ROUTES.PROFILES}?search=avery&offset=0&limit=4`);
    assert.equal(response.status, 200);

    const payload = await response.json();
    assert.equal(payload.data.length, 4);
    assert.equal(payload.meta.pagination.offset, 0);
    assert.equal(payload.meta.pagination.limit, 4);
    assert.equal(typeof payload.meta.pagination.nextOffset === 'number', true);
  } finally {
    await runtime.close();
  }
});

test('queue endpoint returns 202 and legacy alias endpoint is removed', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    const canonical = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'Run report generation', clientId: 2 }),
    });

    assert.equal(canonical.status, 202);
    const canonicalPayload = await canonical.json();
    assert.equal(canonicalPayload.data.status, 'pending');
    assert.equal(canonicalPayload.data.clientId, 2);
    assert.equal(canonicalPayload.data.requestId, canonicalPayload.data.id);

    const legacyAlias = await fetch(`${baseUrl}/api/queue-jobs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'legacy-path-check' }),
    });

    assert.equal(legacyAlias.status, 404);
  } finally {
    await runtime.close();
  }
});

test('rate limit returns 429 after configured threshold', async () => {
  const { runtime, baseUrl } = await startRuntime({
    rateLimitMaxRequests: 1,
    rateLimitWindowMs: 60_000,
  });

  try {
    const first = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'first' }),
    });

    const second = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'second' }),
    });

    assert.equal(first.status, 202);
    assert.equal(second.status, 429);

    const payload = await second.json();
    assert.equal(payload.error.code, 'RATE_LIMIT_EXCEEDED');
  } finally {
    await runtime.close();
  }
});

test('queue overflow returns QUEUE_FULL', async () => {
  const { runtime, baseUrl } = await startRuntime({
    maxQueueSize: 1,
    jobDelayMs: 300,
    queueWorkerConcurrency: 1,
    rateLimitMaxRequests: 100,
  });

  try {
    const first = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'first' }),
    });

    const second = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'second' }),
    });

    const third = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'third' }),
    });

    assert.equal(first.status, 202);
    assert.equal(second.status, 202);
    assert.equal(third.status, 429);

    const payload = await third.json();
    assert.equal(payload.error.code, 'QUEUE_FULL');
  } finally {
    await runtime.close();
  }
});

test('cors middleware blocks unknown origins', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    const response = await fetch(`${baseUrl}${API_ROUTES.PROFILES}`, {
      headers: {
        origin: 'http://evil.example.com',
      },
    });

    assert.equal(response.status, 403);
    const payload = await response.json();
    assert.equal(payload.error.code, 'CORS_DENIED');
  } finally {
    await runtime.close();
  }
});

test('metrics endpoint exposes backend metrics', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    await fetch(`${baseUrl}${API_ROUTES.HEALTH}`);
    await fetch(`${baseUrl}${API_ROUTES.PROFILES}`);

    const metricsResponse = await fetch(`${baseUrl}${API_ROUTES.METRICS}`);
    assert.equal(metricsResponse.status, 200);

    const metricsPayload = await metricsResponse.text();
    assert.match(metricsPayload, new RegExp(METRIC_NAMES.HTTP_REQUESTS_TOTAL));
    assert.match(metricsPayload, new RegExp(METRIC_NAMES.QUEUE_DEPTH));
    assert.match(metricsPayload, new RegExp(METRIC_NAMES.SOCKET_CONNECTIONS_CURRENT));
  } finally {
    await runtime.close();
  }
});

test('socket emits canonical queue-result only and does not emit removed aliases', async () => {
  const { runtime, baseUrl } = await startRuntime({ jobDelayMs: 50 });

  let socket: Socket | null = null;

  try {
    socket = createSocketClient(baseUrl, {
      transports: ['websocket'],
      timeout: 2000,
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 2_000);

      socket?.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket?.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const createResponse = await fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ input: 'socket-job' }),
    });
    assert.equal(createResponse.status, 202);

    const created = await createResponse.json();
    const targetId = created.data.id;
    let legacyAliasReceived = false;

    await new Promise<void>((resolve, reject) => {
      let canonicalReceived = false;
      const timeout = setTimeout(() => {
        reject(new Error('Did not receive queue-result socket event or received a removed alias event'));
      }, 3_000);

      const maybeDone = () => {
        if (canonicalReceived && !legacyAliasReceived) {
          clearTimeout(timeout);
          resolve();
        }
      };

      const captureLegacyAlias = (payload: unknown) => {
        const data = (payload as { data?: { id?: string; requestId?: string } })?.data ?? {};
        const id = data.requestId ?? data.id;
        if (id === targetId) {
          legacyAliasReceived = true;
        }
      };

      socket?.on('job-result', captureLegacyAlias);
      socket?.on('job:updated', captureLegacyAlias);

      socket?.on(SOCKET_EVENTS.QUEUE_RESULT, (payload: unknown) => {
        const data = (payload as { data?: { id?: string; requestId?: string; status?: string } })?.data ?? {};
        assert.equal(typeof data.requestId, 'string');
        assert.equal(typeof data.status, 'string');
        const id = data.requestId ?? data.id;
        if (id === targetId) {
          canonicalReceived = true;
          setTimeout(maybeDone, 100);
        }
      });
    });

    assert.equal(legacyAliasReceived, false);
  } finally {
    socket?.disconnect();
    await runtime.close();
  }
});

test('queue flow for 20 jobs returns pending first and terminal websocket updates', async () => {
  const { runtime, baseUrl } = await startRuntime({
    jobDelayMs: 100,
    queueWorkerConcurrency: 20,
    rateLimitMaxRequests: 200,
  });

  let socket: Socket | null = null;

  try {
    socket = createSocketClient(baseUrl, {
      transports: ['websocket'],
      timeout: 2_000,
    });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'));
      }, 2_000);

      socket?.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      socket?.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    const terminalStatuses = new Set(['completed', 'failed']);
    const resolved = new Set<string>();

    socket.on(SOCKET_EVENTS.QUEUE_RESULT, (payload: unknown) => {
      const data = (payload as { data?: { requestId?: string; id?: string; status?: string } })?.data ?? {};
      const requestId = String(data.requestId ?? data.id ?? '');

      if (!requestId || !data.status || !terminalStatuses.has(data.status)) {
        return;
      }

      resolved.add(requestId);
    });

    const createResponses = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        fetch(`${baseUrl}${API_ROUTES.JOBS}`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ input: `batch-${index + 1}`, clientId: index + 1 }),
        }),
      ),
    );

    const createdPayloads = await Promise.all(createResponses.map((response) => response.json()));

    const requestIds = createdPayloads.map((payload) => String(payload?.data?.requestId ?? payload?.data?.id ?? ''));

    assert.equal(createResponses.every((response) => response.status === 202), true);
    assert.equal(createdPayloads.every((payload) => payload?.data?.status === 'pending'), true);
    assert.equal(requestIds.every((requestId) => requestId.length > 0), true);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timed out waiting terminal updates. Resolved: ${resolved.size}/20`));
      }, 5_000);

      const interval = setInterval(() => {
        const allResolved = requestIds.every((requestId) => resolved.has(requestId));

        if (!allResolved) {
          return;
        }

        clearInterval(interval);
        clearTimeout(timeout);
        resolve();
      }, 25);
    });
  } finally {
    socket?.disconnect();
    await runtime.close();
  }
});

test('stream endpoint survives aborted client stream', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    const controller = new AbortController();
    const response = await fetch(`${baseUrl}${API_ROUTES.STREAM_TEXT}`, {
      signal: controller.signal,
    });

    assert.equal(response.status, 200);

    const reader = response.body?.getReader();
    if (reader) {
      await reader.read();
    }

    controller.abort();
    await wait(40);

    const healthResponse = await fetch(`${baseUrl}${API_ROUTES.HEALTH}`);
    assert.equal(healthResponse.status, 200);
  } finally {
    await runtime.close();
  }
});

test('main process handles SIGTERM with graceful shutdown', async () => {
  const entryPath = path.join(__dirname, '..', '..', 'main.js');
  const child = spawn(process.execPath, [entryPath], {
    env: {
      ...process.env,
      PORT: '0',
      LOG_LEVEL: 'silent',
      SHUTDOWN_GRACE_MS: '2000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Backend child process did not report startup in time.'));
    }, 5_000);

    const onStdoutData = (chunk: Buffer) => {
      const message = chunk.toString();
      if (message.includes('presight-backend listening on')) {
        clearTimeout(timeout);
        child.stdout?.off('data', onStdoutData);
        resolve();
      }
    };

    child.once('error', (error) => {
      clearTimeout(timeout);
      child.stdout?.off('data', onStdoutData);
      reject(error);
    });

    child.once('exit', (code) => {
      clearTimeout(timeout);
      child.stdout?.off('data', onStdoutData);
      reject(new Error(`Backend child process exited before startup with code ${String(code)}.`));
    });

    child.stdout?.on('data', onStdoutData);
  });

  child.kill('SIGTERM');

  const exitResult = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
    child.once('exit', (code, signal) => {
      resolve({ code, signal });
    });
  });

  assert.equal(exitResult.signal, null);
  assert.equal(exitResult.code, 0);
});
