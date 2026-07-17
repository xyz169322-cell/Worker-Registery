import React, { createContext, useContext, useState } from 'react';
import { ur } from '../strings/ur';
import { en } from '../strings/en';

type Lang = 'ur' | 'en';
type Strings = typeof en;

interface I18nContext {
  lang: Lang;
  t: Strings;
  setLang: (l: Lang) => void;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContext>({
  lang: 'ur',
  t: ur as any,
  setLang: () => {},
  isRtl: true,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('ur');
  const t = lang === 'ur' ? ur : en;
  const isRtl = lang === 'ur';

  return (
    <I18nContext.Provider value={{ lang, t: t as Strings, setLang, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
