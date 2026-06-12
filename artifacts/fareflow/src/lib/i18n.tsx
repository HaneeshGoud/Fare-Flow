import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import en from "@/locales/en.json";
import te from "@/locales/te.json";

export type Lang = "en" | "te";

const translations: Record<Lang, Record<string, string>> = { en, te };

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

const STORAGE_KEY = "fareflow-language";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "te" ? "te" : "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    const dict = translations[lang];
    let str = dict[key] ?? translations["en"][key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v));
      });
    }
    return str;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
