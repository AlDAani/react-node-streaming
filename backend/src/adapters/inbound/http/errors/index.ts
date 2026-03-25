import { DEFAULT_ERROR_CODE_BY_STATUS, ERROR_CODES, INTERNAL_ERROR_MESSAGE } from './constants';
import { IApiErrorPayload, IErrorLike } from './types';

export class ApiError extends Error {
  public statusCode: number;

  public code: string;

  public details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function toErrorLike(value: unknown): IErrorLike {
  if (!value || typeof value !== 'object') {
    return {};
  }

  return value as IErrorLike;
}

function normalizeStatusCode(source: IErrorLike): number {
  if (typeof source.statusCode !== 'number') {
    return 500;
  }

  if (source.statusCode < 400 || source.statusCode > 599) {
    return 500;
  }

  return source.statusCode;
}

function normalizeCode(source: IErrorLike, statusCode: number): string {
  if (typeof source.code === 'string' && source.code.length > 0) {
    return source.code;
  }

  const mappedCode = DEFAULT_ERROR_CODE_BY_STATUS[statusCode];
  if (mappedCode) {
    return mappedCode;
  }

  if (statusCode >= 500) {
    return ERROR_CODES.INTERNAL;
  }

  return ERROR_CODES.INVALID_REQUEST;
}

function normalizeMessage(source: IErrorLike, statusCode: number): string {
  if (statusCode >= 500) {
    return INTERNAL_ERROR_MESSAGE;
  }

  if (typeof source.message === 'string' && source.message.trim().length > 0) {
    return source.message;
  }

  return INTERNAL_ERROR_MESSAGE;
}

export function createErrorPayload(error: unknown, requestId: string): IApiErrorPayload {
  const source = toErrorLike(error);
  const statusCode = normalizeStatusCode(source);
  const code = normalizeCode(source, statusCode);
  const message = normalizeMessage(source, statusCode);

  return {
    error: {
      code,
      message,
      details: source.details ?? null,
      requestId,
    },
  };
}

export type { IApiErrorPayload } from './types';
