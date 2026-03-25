import i18next from 'i18next';
import {
  API_TRANSLATIONS,
  type ApiTranslationKey,
  DEFAULT_API_TRANSLATION_KEY,
} from './common-translations';

const LOCALE_STORAGE_KEY = 'presight.locale';

export const SUPPORTED_LANGUAGES = ['en', 'ar-AE'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const FALLBACK_LOCALE: SupportedLanguage = 'en';

const isSupportedLanguage = (value: string): value is SupportedLanguage =>
  SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);

const normalizeBrowserLocale = (value: string | null | undefined): SupportedLanguage => {
  if (!value) {
    return FALLBACK_LOCALE;
  }

  if (isSupportedLanguage(value)) {
    return value;
  }

  const lowerCased = value.toLowerCase();

  if (lowerCased.startsWith('ar')) {
    return 'ar-AE';
  }

  return FALLBACK_LOCALE;
};

const getStoredLocale = (): SupportedLanguage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (!storedLocale) {
    return null;
  }

  return isSupportedLanguage(storedLocale) ? storedLocale : normalizeBrowserLocale(storedLocale);
};

export const CURRENT_LOCALE: SupportedLanguage =
  getStoredLocale() ??
  normalizeBrowserLocale(typeof navigator === 'undefined' ? null : navigator.language);

export const saveCurrentLocale = (locale: SupportedLanguage) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
};

const resolveApiTranslationKey = (key: string): ApiTranslationKey => {
  if (Object.prototype.hasOwnProperty.call(API_TRANSLATIONS, key)) {
    return key as ApiTranslationKey;
  }

  return DEFAULT_API_TRANSLATION_KEY;
};

export const translateApiError = (key: string, options?: Record<string, unknown> | null) => {
  const translationKey = API_TRANSLATIONS[resolveApiTranslationKey(key)];

  return options ? i18next.t(translationKey, options) : i18next.t(translationKey);
};
