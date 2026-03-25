import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError, createErrorPayload } from './index';

test('ApiError keeps structured metadata', () => {
  const error = new ApiError(400, 'INVALID_INPUT', 'Validation failed', { field: 'search' });
  assert.equal(error.statusCode, 400);
  assert.equal(error.code, 'INVALID_INPUT');
  assert.deepEqual(error.details, { field: 'search' });
});

test('createErrorPayload hides internal messages', () => {
  const payload = createErrorPayload(new Error('boom'), 'req-1');
  assert.equal(payload.error.code, 'INTERNAL_ERROR');
  assert.equal(payload.error.message, 'An unexpected error occurred.');
  assert.equal(payload.error.requestId, 'req-1');
});

test('createErrorPayload keeps client-safe messages for 4xx', () => {
  const payload = createErrorPayload(new ApiError(404, 'NOT_FOUND', 'Route missing'), 'req-2');
  assert.equal(payload.error.code, 'NOT_FOUND');
  assert.equal(payload.error.message, 'Route missing');
});

test('createErrorPayload falls back to mapped code for known statuses', () => {
  const payload = createErrorPayload(new ApiError(429, '', 'Too many requests'), 'req-3');
  assert.equal(payload.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.equal(payload.error.message, 'Too many requests');
});

test('createErrorPayload falls back to INVALID_REQUEST for generic 4xx', () => {
  const payload = createErrorPayload({ statusCode: 400, message: 'Bad request.' }, 'req-4');
  assert.equal(payload.error.code, 'INVALID_REQUEST');
  assert.equal(payload.error.message, 'Bad request.');
});
