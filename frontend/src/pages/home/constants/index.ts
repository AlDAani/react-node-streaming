import { ROUTE_PATHS } from '@/constants/routes/route-names';
import { HOME_TRANSLATIONS } from './translations';

export const HOME_BLOCK_NAME = 'Home-page';

export const HOME_FEATURE_LINKS = [
  {
    path: `/${ROUTE_PATHS.profiles}`,
    titleKey: HOME_TRANSLATIONS.profilesTitle,
    descriptionKey: HOME_TRANSLATIONS.profilesDescription,
  },
  {
    path: `/${ROUTE_PATHS.streamReader}`,
    titleKey: HOME_TRANSLATIONS.streamTitle,
    descriptionKey: HOME_TRANSLATIONS.streamDescription,
  },
  {
    path: `/${ROUTE_PATHS.queueWorker}`,
    titleKey: HOME_TRANSLATIONS.queueTitle,
    descriptionKey: HOME_TRANSLATIONS.queueDescription,
  },
] as const;
