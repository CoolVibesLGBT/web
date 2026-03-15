declare module 'react-i18next' {
  import type { FC, ReactNode } from 'react';
  export const initReactI18next: unknown;
  export function useTranslation(ns?: string): { t: (key: string, opts?: Record<string, unknown>) => string };
  export const I18nextProvider: FC<{ children?: ReactNode; i18n: unknown }>;
}
