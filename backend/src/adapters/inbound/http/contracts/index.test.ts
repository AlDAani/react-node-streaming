import assert from 'node:assert/strict';
import test from 'node:test';
import { API_ROUTES } from './index';

test('http contracts expose canonical routes only', () => {
  assert.equal(API_ROUTES.JOBS, '/api/jobs');
  assert.equal((Object.values(API_ROUTES) as string[]).includes('/api/queue-jobs'), false);
});
