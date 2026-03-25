import { APP_NAMESPACE } from './app-namespace';

const COMMON_SUB_NAMESPACE = 'common';

export const COMMON_TRANSLATIONS = {
  loading: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.loading`,
  retry: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.retry`,
  offline: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.offline`,
  restricted: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.restricted`,
  error: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.error`,
  close: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.close`,
} as const;

export const API_TRANSLATIONS = {
  unknown: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.unknown`,
  network: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.network`,
  timeout: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.timeout`,
  notFound: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.notFound`,
  validation: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.validation`,
  streamFailed: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.streamFailed`,
  socketDisconnected: `${APP_NAMESPACE}:${COMMON_SUB_NAMESPACE}.socketDisconnected`,
} as const;

export type ApiTranslationKey = keyof typeof API_TRANSLATIONS;

export const DEFAULT_API_TRANSLATION_KEY: ApiTranslationKey = 'unknown';
