import assert from 'node:assert/strict';
import test from 'node:test';
import { API_ROUTES } from './contracts';
import { createServerRuntime } from '../../../infrastructure/runtime';

async function startRuntime() {
  const runtime = createServerRuntime({
    port: 0,
    jobDelayMs: 25,
  });

  await runtime.start();
  const address = runtime.server.address();
  const port = typeof address === 'object' && address ? address.port : 0;

  return {
    runtime,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

test('module routes are registered and respond', async () => {
  const { runtime, baseUrl } = await startRuntime();

  try {
    const health = await fetch(`${baseUrl}${API_ROUTES.HEALTH}`);
    const profiles = await fetch(`${baseUrl}${API_ROUTES.PROFILES}`);
    const stream = await fetch(`${baseUrl}${API_ROUTES.STREAM_TEXT}`);

    assert.equal(health.status, 200);
    assert.equal(profiles.status, 200);
    assert.equal(stream.status, 200);
  } finally {
    await runtime.close();
  }
});
