import type { SupportedLanguage } from '@/constants/i18next/i18next-constants';
import arAEDictionary from './ar-AE.json';
import enDictionary from './en.json';

export type TranslationDictionary = Record<string, string | Record<string, string>>;

export const I18N_DICTIONARY: Record<SupportedLanguage, TranslationDictionary> = {
  en: enDictionary,
  'ar-AE': arAEDictionary,
};
