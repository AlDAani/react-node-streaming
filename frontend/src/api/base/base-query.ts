import {
  type BaseQueryFn,
  type FetchArgs,
  fetchBaseQuery,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '@/api/constants/base-url';
import type { ApiBaseError } from '@/api/types/api-error';
import { buildApiError, mapStatusCodeToErrorCode } from '@/api/utils/api-error';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  },
});

const normalizeBaseQueryError = (error: FetchBaseQueryError): ApiBaseError => {
  if (typeof error.status === 'number') {
    return buildApiError(mapStatusCodeToErrorCode(error.status), error.status);
  }

  if (error.status === 'FETCH_ERROR') {
    return buildApiError('network', 0);
  }

  if (error.status === 'TIMEOUT_ERROR') {
    return buildApiError('timeout', 408);
  }

  if (error.status === 'PARSING_ERROR') {
    const status = typeof error.originalStatus === 'number' ? error.originalStatus : 500;

    return buildApiError(mapStatusCodeToErrorCode(status), status);
  }

  return buildApiError('unknown', 500);
};

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, ApiBaseError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    return {
      error: normalizeBaseQueryError(result.error),
    };
  }

  return {
    data: result.data,
  };
};
