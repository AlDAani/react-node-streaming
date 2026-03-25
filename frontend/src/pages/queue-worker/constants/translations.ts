import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';

const QUEUE_WORKER_SUB_NAMESPACE = 'queue-worker';

export const QUEUE_WORKER_TRANSLATIONS = {
  title: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.title`,
  description: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.description`,
  runBatch: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.runBatch`,
  reset: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.reset`,
  socketConnected: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.socketConnected`,
  socketDisconnected: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.socketDisconnected`,
  socketReconnecting: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.socketReconnecting`,
  pollingFallback: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.pollingFallback`,
  runtimePreflightChecking: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.runtimePreflightChecking`,
  socketWatchdogWarning: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.socketWatchdogWarning`,
  statusIdle: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.statusIdle`,
  statusPending: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.statusPending`,
  statusDone: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.statusDone`,
  statusError: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.statusError`,
  statusLabel: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.statusLabel`,
  resultLabel: `${APP_NAMESPACE}:${QUEUE_WORKER_SUB_NAMESPACE}.resultLabel`,
} as const;
