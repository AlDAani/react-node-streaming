import { ApiError } from '../../errors';
import type { IJobPayload } from '@/application/contracts/input';
import {
  DEFAULT_JOB_INPUT,
  DEFAULT_JOBS_LIST_LIMIT,
  MAX_JOB_INPUT_LENGTH,
  MAX_JOBS_LIST_LIMIT,
} from '@/infrastructure/runtime/constants';

function parseInteger(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

export function validateJobsListLimit(value: unknown): number {
  const limit = parseInteger(value, DEFAULT_JOBS_LIST_LIMIT);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_JOBS_LIST_LIMIT) {
    throw new ApiError(400, 'INVALID_LIMIT', `limit must be between 1 and ${MAX_JOBS_LIST_LIMIT}.`);
  }

  return limit;
}

export function validateJobPayload(body: unknown): IJobPayload {
  if (body === undefined || body === null || body === '') {
    return { input: DEFAULT_JOB_INPUT, clientId: null };
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_JOB_PAYLOAD', 'Request body must be a JSON object.');
  }

  const source = body as { input?: unknown; clientId?: unknown };
  let input = DEFAULT_JOB_INPUT;

  if (source.input !== undefined) {
    if (typeof source.input !== 'string') {
      throw new ApiError(400, 'INVALID_JOB_INPUT', 'input must be a string.');
    }

    const trimmed = source.input.trim();
    if (!trimmed) {
      throw new ApiError(400, 'INVALID_JOB_INPUT', 'input must not be empty.');
    }

    if (trimmed.length > MAX_JOB_INPUT_LENGTH) {
      throw new ApiError(400, 'INVALID_JOB_INPUT', `input must be ${MAX_JOB_INPUT_LENGTH} characters or fewer.`);
    }

    input = trimmed;
  }

  let clientId: number | null = null;
  if (source.clientId !== undefined && source.clientId !== null) {
    const parsedClientId = Number(source.clientId);

    if (!Number.isInteger(parsedClientId) || parsedClientId < 1) {
      throw new ApiError(400, 'INVALID_CLIENT_ID', 'clientId must be a positive integer.');
    }

    clientId = parsedClientId;
  }

  return { input, clientId };
}

export type { IJobPayload };
