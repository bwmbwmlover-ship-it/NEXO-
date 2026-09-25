import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { en } from "./en";
import { ru } from "./ru";
import { uz } from "./uz";
import type { Dict } from "./types";

export type LangCode = "uz" | "ru" | "en";

export const LOCALES: Record<LangCode, Dict> = { uz, ru, en };
export const LANG_ORDER: LangCode[] = ["uz", "ru", "en"];
const STORAGE_KEY = "nexo-lang";

interface LanguageContextValue {
  lang: LangCode;
  dict: Dict;
  setLang: (l: LangCode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  dict: en,
  setLang: () => {},
});

function detectLang(): LangCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as LangCode | null;
    if (stored && stored in LOCALES) return stored;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (nav === "uz" || nav === "ru" || nav === "en") return nav as LangCode;
  } catch {
    /* ignore */
  }
  return "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => detectLang());

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ lang, dict: LOCALES[lang], setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
