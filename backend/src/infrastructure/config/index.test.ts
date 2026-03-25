import assert from 'node:assert/strict';
import test from 'node:test';
import { createConfig } from './index';
import { APP_NAME, DEFAULT_PORT } from './constants';

test('createConfig returns defaults', () => {
  const config = createConfig({});
  assert.equal(config.appName, APP_NAME);
  assert.equal(config.port, DEFAULT_PORT);
  assert.deepEqual(config.corsOrigins, ['http://localhost:5173']);
  assert.equal(config.rateLimitMaxRequests > 0, true);
  assert.equal(config.queueWorkerConcurrency, 20);
});

test('createConfig applies overrides', () => {
  const config = createConfig({
    port: 4999,
    pageSizeMax: 100,
    corsOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    maxQueueSize: 50,
    maxStoredJobs: 100,
    queueWorkerConcurrency: 8,
  });

  assert.equal(config.port, 4999);
  assert.equal(config.pageSizeMax, 100);
  assert.deepEqual(config.corsOrigins, ['http://localhost:5173', 'http://127.0.0.1:5173']);
  assert.equal(config.maxQueueSize, 50);
  assert.equal(config.queueWorkerConcurrency, 8);
});

test('createConfig throws for invalid values', () => {
  assert.throws(() => {
    createConfig({
      pageSizeDefault: 100,
      pageSizeMax: 10,
      queueWorkerConcurrency: 0,
    });
  });
});
