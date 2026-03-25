import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';

const HOME_SUB_NAMESPACE = 'home';

export const HOME_TRANSLATIONS = {
  title: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.title`,
  subtitle: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.subtitle`,
  profilesTitle: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.profilesTitle`,
  profilesDescription: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.profilesDescription`,
  streamTitle: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.streamTitle`,
  streamDescription: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.streamDescription`,
  queueTitle: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.queueTitle`,
  queueDescription: `${APP_NAMESPACE}:${HOME_SUB_NAMESPACE}.queueDescription`,
} as const;
