import assert from 'node:assert/strict';
import test from 'node:test';
import type { IApiErrorEnvelope, IJobPayload, IListProfilesParams } from './index';

test('application contracts stay stable for error envelopes', () => {
  const payload: IApiErrorEnvelope = {
    error: {
      code: 'TEST',
      message: 'Message',
      details: null,
      requestId: 'request-id',
    },
  };

  assert.equal(payload.error.code, 'TEST');
});

test('application contracts stay stable for jobs and profile listing input', () => {
  const jobPayload: IJobPayload = {
    input: 'process request',
    clientId: 1,
  };
  const profileParams: IListProfilesParams = {
    cursor: 0,
    limit: 20,
    search: '',
    nationality: '',
    hobby: '',
    ageMin: null,
    ageMax: null,
  };

  assert.equal(jobPayload.clientId, 1);
  assert.equal(profileParams.limit, 20);
});
