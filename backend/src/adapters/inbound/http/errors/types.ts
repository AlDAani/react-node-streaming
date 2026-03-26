import type { IApiErrorEnvelope } from '@/application/contracts';

export interface IApiErrorPayload extends IApiErrorEnvelope {}

export interface IErrorLike {
  statusCode?: number;
  code?: string;
  message?: string;
  details?: unknown;
}
