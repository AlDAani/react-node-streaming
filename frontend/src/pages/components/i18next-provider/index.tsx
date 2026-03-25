import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CURRENT_LOCALE,
  saveCurrentLocale,
  type SupportedLanguage,
} from '@/constants/i18next/i18next-constants';
import { i18next, setLanguage } from '@/i18n/instance';
import { normalizeLocale } from '@/i18n/locale';
import { LocaleContext } from './locale-context';

type I18nextProviderProps = {
  children: ReactNode;
};

export const I18nextProvider = ({ children }: I18nextProviderProps) => {
  const [locale, setLocaleState] = useState<SupportedLanguage>(CURRENT_LOCALE);

  useEffect(() => {
    const onLanguageChanged = (nextLocale: string) => {
      setLocaleState(normalizeLocale(nextLocale));
    };

    i18next.on('languageChanged', onLanguageChanged);

    return () => {
      i18next.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: SupportedLanguage) => {
    await setLanguage(nextLocale);
    saveCurrentLocale(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={contextValue}>{children}</LocaleContext.Provider>;
};
