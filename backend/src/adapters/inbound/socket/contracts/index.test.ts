import assert from 'node:assert/strict';
import test from 'node:test';
import { SOCKET_EVENTS } from './index';

test('socket contracts expose canonical events only', () => {
  assert.equal(SOCKET_EVENTS.QUEUE_RESULT, 'queue-result');
  assert.equal(SOCKET_EVENTS.JOBS_SNAPSHOT, 'jobs:snapshot');
  assert.equal((Object.values(SOCKET_EVENTS) as string[]).includes('job-result'), false);
  assert.equal((Object.values(SOCKET_EVENTS) as string[]).includes('job:updated'), false);
});
