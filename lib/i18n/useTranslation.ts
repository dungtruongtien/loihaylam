'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import en from './en.json';
import vi from './vi.json';

type Lang = 'en' | 'vi';
type Translations = typeof en;

const translations: Record<Lang, Translations> = { en, vi };

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function useTranslation() {
  return useContext(I18nContext);
}

export function useI18nProvider(): I18nContextValue {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'en' || saved === 'vi') { setLangState(saved); return; }
    // Default to English; switch to Vietnamese only if browser is explicitly Vietnamese
    const browser = navigator.language?.toLowerCase() || '';
    setLangState(browser.startsWith('vi') ? 'vi' : 'en');
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('lang', l);
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[lang] as Record<string, string>;
    return dict[key] ?? (translations['en'] as Record<string, string>)[key] ?? key;
  }, [lang]);

  return { lang, setLang, t };
}
