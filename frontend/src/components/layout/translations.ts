import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';

const SHELL_SUB_NAMESPACE = 'shell';

export const APP_SHELL_TRANSLATIONS = {
  title: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.title`,
  description: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.description`,
  languageLabel: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.languageLabel`,
  languageEnglish: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.languageEnglish`,
  languageArabic: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.languageArabic`,
  home: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.home`,
  profiles: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.profiles`,
  streamReader: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.streamReader`,
  queueWorker: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.queueWorker`,
  installApp: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.installApp`,
  installHelp: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.installHelp`,
  installed: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.installed`,
  installHint: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.installHint`,
  installHintIos: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.installHintIos`,
  installHintBrowserMenu: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.installHintBrowserMenu`,
  updateReady: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.updateReady`,
  updateAction: `${APP_NAMESPACE}:${SHELL_SUB_NAMESPACE}.updateAction`,
} as const;
