import { beforeAll, describe, expect, it } from 'vitest';
import { i18next, initI18next } from '@/i18n/instance';
import { API_TRANSLATIONS } from './common-translations';
import { translateApiError } from './i18next-constants';

describe('translateApiError', () => {
  beforeAll(async () => {
    await initI18next();
  });

  it('returns translated message for known API key', () => {
    expect(translateApiError('notFound')).toBe(i18next.t(API_TRANSLATIONS.notFound));
  });

  it('falls back to unknown translation for unsupported API key', () => {
    expect(translateApiError('unsupported-code')).toBe(i18next.t(API_TRANSLATIONS.unknown));
  });
});
