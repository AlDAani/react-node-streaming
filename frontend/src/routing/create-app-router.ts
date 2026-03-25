import { createElement } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { App } from '@/components/app';
import type { ErrorBoundaryScope } from '@/components/error-boundary';
import { RouteErrorFallback } from '@/components/error-boundary/route-error-fallback';
import { ROUTE_NAMES } from '@/constants/routes/route-names';
import { routes } from '@/pages/routes';

const getRouteScope = (routeName: string): ErrorBoundaryScope => {
  switch (routeName) {
    case ROUTE_NAMES.home:
      return 'home';
    case ROUTE_NAMES.profiles:
      return 'profiles';
    case ROUTE_NAMES.streamReader:
      return 'stream-reader';
    case ROUTE_NAMES.queueWorker:
      return 'queue-worker';
    default:
      return 'global';
  }
};

const childRoutes: RouteObject[] = routes.map((route) => ({
  id: route.name,
  path: route.path,
  lazy: route.lazy,
  errorElement: createElement(RouteErrorFallback, {
    scope: getRouteScope(route.name),
  }),
  handle: {
    routeName: route.name,
    i18n: route.i18n,
  },
}));

export const createAppRouter = () =>
  createBrowserRouter([
    {
      id: 'root',
      path: '/',
      Component: App,
      errorElement: createElement(RouteErrorFallback, {
        scope: 'global',
      }),
      children: childRoutes,
    },
  ]);
