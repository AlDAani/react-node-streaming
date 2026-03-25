import type { SupportedLanguage } from '@/constants/i18next/i18next-constants';

export const isRtlLocale = (locale: string) => locale.toLowerCase().startsWith('ar');

export const applyLocaleToDocument = (locale: string) => {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.lang = locale;
  document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
};

export const normalizeLocale = (locale: string): SupportedLanguage =>
  isRtlLocale(locale) ? 'ar-AE' : 'en';
