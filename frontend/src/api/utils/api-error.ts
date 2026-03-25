import i18next from 'i18next';
import type { ApiBaseError, ApiErrorCode } from '@/api/types/api-error';
import { translateApiError } from '@/constants/i18next/i18next-constants';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const mapStatusCodeToErrorCode = (status: number): ApiErrorCode => {
  if (status === 404) {
    return 'notFound';
  }

  if (status === 400 || status === 422) {
    return 'validation';
  }

  if (status === 408) {
    return 'timeout';
  }

  return 'unknown';
};

export const buildApiError = (code: ApiErrorCode, status = 0): ApiBaseError => ({
  status,
  code,
  message: translateApiError(code),
});

export const isApiBaseError = (value: unknown): value is ApiBaseError => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.status === 'number' &&
    typeof value.code === 'string' &&
    typeof value.message === 'string'
  );
};

export const getApiErrorMessage = (error: unknown, fallbackTranslationKey: string): string => {
  if (isApiBaseError(error)) {
    return error.message;
  }

  return i18next.t(fallbackTranslationKey);
};
