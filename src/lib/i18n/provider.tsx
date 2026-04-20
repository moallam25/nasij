'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { dictionaries, type Locale, type Dict } from './dictionaries';

type Ctx = {
  locale: Locale;
  t: Dict;
  toggleLocale: () => void;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('nasij-locale')) as Locale | null;
    if (stored === 'ar' || stored === 'en') setLocaleState(stored);
  }, []);

  useEffect(() => {
    const dir = dictionaries[locale].dir;
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    localStorage.setItem('nasij-locale', locale);
  }, [locale]);

  const setLocale = (l: Locale) => setLocaleState(l);
  const toggleLocale = () => setLocaleState((l) => (l === 'ar' ? 'en' : 'ar'));

  return (
    <LocaleContext.Provider value={{ locale, t: dictionaries[locale], toggleLocale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
