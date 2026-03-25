import type { RouteObject } from 'react-router-dom';

export type AppRouteModule = {
  name: string;
  path: string;
  lazy: NonNullable<RouteObject['lazy']>;
  i18n: {
    namespaces: string[];
    localDictionaryFiles: Record<string, unknown>;
  };
};
