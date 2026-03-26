import type { Request } from 'express';
import type { IListProfilesParams } from '@/application/contracts/input';
import type { IServerConfig } from '@/infrastructure/config/types';
import { ApiError } from '../../errors';

const MAX_SEARCH_LENGTH = 80;
const MAX_FILTER_LENGTH = 60;

function parseInteger(value: unknown, fallback: number): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

export function validateListProfilesQuery(query: Request['query'], config: IServerConfig): IListProfilesParams {
  const offset = parseInteger(query.offset, 0);
  const limit = parseInteger(query.limit, config.pageSizeDefault);
  const ageMin = query.ageMin === undefined ? null : parseInteger(query.ageMin, 0);
  const ageMax = query.ageMax === undefined ? null : parseInteger(query.ageMax, 0);

  if (!Number.isInteger(offset) || offset < 0) {
    throw new ApiError(400, 'INVALID_OFFSET', 'offset must be a non-negative integer.');
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > config.pageSizeMax) {
    throw new ApiError(400, 'INVALID_LIMIT', `limit must be between 1 and ${config.pageSizeMax}.`);
  }

  if (ageMin !== null && (!Number.isInteger(ageMin) || ageMin < 0)) {
    throw new ApiError(400, 'INVALID_AGE_MIN', 'ageMin must be a non-negative integer.');
  }

  if (ageMax !== null && (!Number.isInteger(ageMax) || ageMax < 0)) {
    throw new ApiError(400, 'INVALID_AGE_MAX', 'ageMax must be a non-negative integer.');
  }

  if (ageMin !== null && ageMax !== null && ageMin > ageMax) {
    throw new ApiError(400, 'INVALID_AGE_RANGE', 'ageMin must be less than or equal to ageMax.');
  }

  return {
    offset,
    limit,
    search: typeof query.search === 'string' ? query.search.slice(0, MAX_SEARCH_LENGTH) : '',
    nationality: typeof query.nationality === 'string' ? query.nationality.slice(0, MAX_FILTER_LENGTH) : '',
    hobby: typeof query.hobby === 'string' ? query.hobby.slice(0, MAX_FILTER_LENGTH) : '',
    ageMin,
    ageMax,
  };
}

export type { IListProfilesParams };
