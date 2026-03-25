import { createElement } from 'react';
import { I18N_DICTIONARY } from '@/assets/i18next/dictionary';
import { AppErrorBoundary } from '@/components/error-boundary';
import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants/routes/route-names';
import type { AppRouteModule } from '@/pages/types/route-module';
import { QueueWorkerPage } from './index';

const queueWorkerRoute: AppRouteModule = {
  name: ROUTE_NAMES.queueWorker,
  path: ROUTE_PATHS.queueWorker,
  lazy: async () => {
    const QueueWorkerRoutePage = () =>
      createElement(
        AppErrorBoundary,
        {
          scope: 'queue-worker',
        },
        createElement(QueueWorkerPage),
      );

    return {
      Component: QueueWorkerRoutePage,
    };
  },
  i18n: {
    namespaces: [APP_NAMESPACE],
    localDictionaryFiles: I18N_DICTIONARY,
  },
};

export default queueWorkerRoute;
