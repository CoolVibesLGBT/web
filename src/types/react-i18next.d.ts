declare module 'react-i18next' {
  import type { FC, ReactNode } from 'react';
  import type { i18n as I18nInstance } from 'i18next';
  export const initReactI18next: unknown;
  export function useTranslation(
    ns?: string
  ): { t: (key: string, opts?: Record<string, unknown>) => string; i18n: I18nInstance; ready: boolean };
  export const I18nextProvider: FC<{ children?: ReactNode; i18n: I18nInstance }>;
}
