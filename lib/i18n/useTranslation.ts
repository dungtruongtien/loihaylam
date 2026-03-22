'use client';
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import en from './en.json';

type Lang = 'en' | 'vi';
type Translations = typeof en;

// en is always bundled (default). vi is loaded on demand only when user switches.
const cache: Partial<Record<Lang, Translations>> = { en };

async function loadLang(lang: Lang): Promise<Translations> {
  if (cache[lang]) return cache[lang]!;
  const mod = await import(`./vi.json`);
  cache.vi = mod.default;
  return cache[lang]!;
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
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
  const [dict, setDict] = useState<Record<string, string>>(en);

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang | null;
    if (saved === 'vi') {
      loadLang('vi').then((d) => { setDict(d as Record<string, string>); setLangState('vi'); });
    }
    // Default: stay on 'en' — already loaded
  }, []);

  const setLang = useCallback((l: Lang) => {
    loadLang(l).then((d) => {
      setDict(d as Record<string, string>);
      setLangState(l);
      localStorage.setItem('lang', l);
    });
  }, []);

  const t = useCallback((key: string): string => {
    return dict[key] ?? (en as Record<string, string>)[key] ?? key;
  }, [dict]);

  return { lang, setLang, t };
}
