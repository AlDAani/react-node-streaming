import { createElement } from 'react';
import { I18N_DICTIONARY } from '@/assets/i18next/dictionary';
import { AppErrorBoundary } from '@/components/error-boundary';
import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants/routes/route-names';
import type { AppRouteModule } from '@/pages/types/route-module';
import { ProfilesPage } from './index';

const profilesRoute: AppRouteModule = {
  name: ROUTE_NAMES.profiles,
  path: ROUTE_PATHS.profiles,
  lazy: async () => {
    const ProfilesRoutePage = () =>
      createElement(
        AppErrorBoundary,
        {
          scope: 'profiles',
        },
        createElement(ProfilesPage),
      );

    return {
      Component: ProfilesRoutePage,
    };
  },
  i18n: {
    namespaces: [APP_NAMESPACE],
    localDictionaryFiles: I18N_DICTIONARY,
  },
};

export default profilesRoute;
