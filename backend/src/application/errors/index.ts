import type { TApplicationErrorCode } from './constants';

export class ApplicationError extends Error {
  public readonly code: TApplicationErrorCode;

  public readonly details?: unknown;

  constructor(code: TApplicationErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.details = details;
  }
}

export { APPLICATION_ERROR_CODES } from './constants';
export type { TApplicationErrorCode } from './constants';
