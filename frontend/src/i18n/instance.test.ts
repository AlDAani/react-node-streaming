import { beforeAll, describe, expect, it } from 'vitest';
import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';
import { HOME_TRANSLATIONS } from '@/pages/home/constants/translations';
import { i18next, initI18next, setLanguage } from './instance';

describe('i18next instance', () => {
  beforeAll(async () => {
    await initI18next();
  });

  it('resolves translation by constants key', () => {
    const value = i18next.t(HOME_TRANSLATIONS.title);

    expect(value.length).toBeGreaterThan(0);
  });

  it('falls back to fallback locale when current locale key is missing', async () => {
    const fallbackOnlyKey = `${APP_NAMESPACE}:test.fallback-only`;

    i18next.addResource('en', APP_NAMESPACE, 'test.fallback-only', 'Fallback value');
    await setLanguage('ar-AE');

    const value = i18next.t(fallbackOnlyKey);

    expect(value).toBe('Fallback value');

    await setLanguage('en');
  });
});
