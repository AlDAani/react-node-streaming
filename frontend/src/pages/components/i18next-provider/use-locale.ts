import { useContext } from 'react';
import { LocaleContext } from './locale-context';

export const useLocale = () => {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocale must be used inside I18nextProvider.');
  }

  return context;
};
