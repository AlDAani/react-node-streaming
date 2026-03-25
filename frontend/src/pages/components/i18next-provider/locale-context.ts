import { createContext } from 'react';
import type { SupportedLanguage } from '@/constants/i18next/i18next-constants';

export type LocaleContextValue = {
  locale: SupportedLanguage;
  setLocale: (locale: SupportedLanguage) => Promise<void>;
};

export const LocaleContext = createContext<LocaleContextValue | null>(null);
