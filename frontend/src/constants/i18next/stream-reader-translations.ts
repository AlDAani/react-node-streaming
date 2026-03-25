import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';

const STREAM_READER_SUB_NAMESPACE = 'stream-reader';

export const STREAM_READER_TRANSLATIONS = {
  title: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.title`,
  description: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.description`,
  start: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.start`,
  stop: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.stop`,
  outputLabel: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.outputLabel`,
  idle: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.idle`,
  connecting: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.connecting`,
  streaming: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.streaming`,
  stopped: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.stopped`,
  done: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.done`,
  error: `${APP_NAMESPACE}:${STREAM_READER_SUB_NAMESPACE}.error`,
} as const;
