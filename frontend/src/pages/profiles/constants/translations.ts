import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';

const PROFILES_SUB_NAMESPACE = 'profiles';

export const PROFILES_TRANSLATIONS = {
  title: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.title`,
  searchLabel: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.searchLabel`,
  searchPlaceholder: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.searchPlaceholder`,
  nationalityLabel: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.nationalityLabel`,
  hobbyLabel: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.hobbyLabel`,
  allOption: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.allOption`,
  loadMore: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.loadMore`,
  empty: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.empty`,
  error: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.error`,
  cardAge: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.cardAge`,
  cardNationality: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.cardNationality`,
  cardHobbies: `${APP_NAMESPACE}:${PROFILES_SUB_NAMESPACE}.cardHobbies`,
} as const;
