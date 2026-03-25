import { createElement } from 'react';
import { I18N_DICTIONARY } from '@/assets/i18next/dictionary';
import { AppErrorBoundary } from '@/components/error-boundary';
import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants/routes/route-names';
import type { AppRouteModule } from '@/pages/types/route-module';
import { HomePage } from './index';

const homeRoute: AppRouteModule = {
  name: ROUTE_NAMES.home,
  path: ROUTE_PATHS.home,
  lazy: async () => {
    const HomeRoutePage = () =>
      createElement(
        AppErrorBoundary,
        {
          scope: 'home',
        },
        createElement(HomePage),
      );

    return {
      Component: HomeRoutePage,
    };
  },
  i18n: {
    namespaces: [APP_NAMESPACE],
    localDictionaryFiles: I18N_DICTIONARY,
  },
};

export default homeRoute;
