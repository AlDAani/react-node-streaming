import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';

const ERROR_BOUNDARY_SUB_NAMESPACE = 'error-boundary';

export const ERROR_BOUNDARY_TRANSLATIONS = {
  description: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.description`,
  reloadApp: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.reloadApp`,
  globalTitle: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.globalTitle`,
  homeTitle: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.homeTitle`,
  profilesTitle: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.profilesTitle`,
  streamReaderTitle: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.streamReaderTitle`,
  queueWorkerTitle: `${APP_NAMESPACE}:${ERROR_BOUNDARY_SUB_NAMESPACE}.queueWorkerTitle`,
} as const;
