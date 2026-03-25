import i18next from 'i18next';
import { I18N_DICTIONARY } from '@/assets/i18next/dictionary';
import { APP_NAMESPACE } from '@/constants/i18next/app-namespace';
import {
  CURRENT_LOCALE,
  FALLBACK_LOCALE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from '@/constants/i18next/i18next-constants';
import { applyLocaleToDocument } from './locale';

const buildResources = () => {
  return Object.fromEntries(
    Object.entries(I18N_DICTIONARY).map(([locale, dictionary]) => [
      locale,
      {
        [APP_NAMESPACE]: dictionary,
      },
    ]),
  );
};

let initialized = false;

export const initI18next = async () => {
  if (initialized && i18next.isInitialized) {
    return;
  }

  await i18next.init({
    lng: CURRENT_LOCALE,
    fallbackLng: FALLBACK_LOCALE,
    defaultNS: APP_NAMESPACE,
    ns: [APP_NAMESPACE],
    resources: buildResources(),
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: {
      escapeValue: false,
    },
  });

  applyLocaleToDocument(i18next.language);
  initialized = true;
};

export const setLanguage = async (locale: SupportedLanguage) => {
  await i18next.changeLanguage(locale);
  applyLocaleToDocument(locale);
};

export { i18next };
