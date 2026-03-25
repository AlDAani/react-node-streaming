import { describe, expect, it } from 'vitest';
import { ROUTE_NAMES, ROUTE_PATHS } from '@/constants/routes/route-names';
import { routes } from './routes';

describe('route registry', () => {
  it('contains expected route names and paths', () => {
    const routeSummary = routes.map((route) => ({
      name: route.name,
      path: route.path,
    }));

    expect(routeSummary).toEqual([
      { name: ROUTE_NAMES.home, path: ROUTE_PATHS.home },
      { name: ROUTE_NAMES.profiles, path: ROUTE_PATHS.profiles },
      { name: ROUTE_NAMES.streamReader, path: ROUTE_PATHS.streamReader },
      { name: ROUTE_NAMES.queueWorker, path: ROUTE_PATHS.queueWorker },
    ]);
  });

  it('keeps lazy loader and i18n metadata for every route', () => {
    routes.forEach((route) => {
      expect(typeof route.lazy).toBe('function');
      expect(route.i18n.namespaces.length).toBeGreaterThan(0);
      expect(Object.keys(route.i18n.localDictionaryFiles).length).toBeGreaterThan(0);
    });
  });
});
