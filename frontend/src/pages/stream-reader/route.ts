import { createElement } from 'react';
import { I18N_DICTIONARY } from '@/assets/i18next/dictionary';
import { AppErrorBoundary } from '@/components/error-boundary';
import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants/routes/route-names';
import type { AppRouteModule } from '@/pages/types/route-module';
import { StreamReaderPage } from './index';

const streamReaderRoute: AppRouteModule = {
  name: ROUTE_NAMES.streamReader,
  path: ROUTE_PATHS.streamReader,
  lazy: async () => {
    const StreamReaderRoutePage = () =>
      createElement(
        AppErrorBoundary,
        {
          scope: 'stream-reader',
        },
        createElement(StreamReaderPage),
      );

    return {
      Component: StreamReaderRoutePage,
    };
  },
  i18n: {
    namespaces: [APP_NAMESPACE],
    localDictionaryFiles: I18N_DICTIONARY,
  },
};

export default streamReaderRoute;
