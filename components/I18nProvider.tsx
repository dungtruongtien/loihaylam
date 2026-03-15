'use client';
import { I18nContext, useI18nProvider, useTranslation } from '@/lib/i18n/useTranslation';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const value = useI18nProvider();
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { useTranslation };
