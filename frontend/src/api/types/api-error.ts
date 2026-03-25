import type { ApiTranslationKey } from '@/constants/i18next/common-translations';

export type ApiErrorCode = ApiTranslationKey;

export type ApiBaseError = {
  status: number;
  code: ApiErrorCode;
  message: string;
};
