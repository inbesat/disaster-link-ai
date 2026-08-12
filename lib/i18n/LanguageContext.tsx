"use client";

// ---------------------------------------------------------------------
// lib/i18n/LanguageContext.tsx — lightweight i18n (Phase 25).
//
// Manages the active UI language and persists the choice to localStorage
// ("preferred_lang"). Covers English + the 22 scheduled languages of
// India (Eighth Schedule). Missing keys fall back to the English string
// (and finally to the key itself).
//
// Bundle strategy: only the English dictionary is statically imported
// (it doubles as the type source and the fallback). The other 22
// dictionaries are lazy webpack chunks loaded on first use, so a citizen
// who only ever reads Hindi never downloads the other 21 languages, and
// every translated page compiles 22 fewer JSON modules.
// ---------------------------------------------------------------------

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import en from "@/locales/en.json";
import { isLocale, type Locale } from "@/lib/i18n/locales";

// Re-export the canonical types from the shared registry so existing
// imports (LanguageSelector, …) keep working unchanged.
export { isLocale, LOCALE_CODES as LOCALES, type Locale } from "@/lib/i18n/locales";

/** The known translation keys — derived from the English dictionary. */
export type TranslationKey = keyof typeof en;

type Dict = Record<string, string>;

const STORAGE_KEY = "preferred_lang";
const FALLBACK_LOCALE: Locale = "en";

/** Per-locale async loaders — each non-English dict is its own chunk. */
const loaders: Record<Locale, () => Promise<Dict>> = {
  en: () => Promise.resolve(en),
  as: () => import("@/locales/as.json").then((m) => m.default as Dict),
  bn: () => import("@/locales/bn.json").then((m) => m.default as Dict),
  brx: () => import("@/locales/brx.json").then((m) => m.default as Dict),
  doi: () => import("@/locales/doi.json").then((m) => m.default as Dict),
  gu: () => import("@/locales/gu.json").then((m) => m.default as Dict),
  hi: () => import("@/locales/hi.json").then((m) => m.default as Dict),
  kn: () => import("@/locales/kn.json").then((m) => m.default as Dict),
  ks: () => import("@/locales/ks.json").then((m) => m.default as Dict),
  kok: () => import("@/locales/kok.json").then((m) => m.default as Dict),
  mai: () => import("@/locales/mai.json").then((m) => m.default as Dict),
  ml: () => import("@/locales/ml.json").then((m) => m.default as Dict),
  mni: () => import("@/locales/mni.json").then((m) => m.default as Dict),
  mr: () => import("@/locales/mr.json").then((m) => m.default as Dict),
  ne: () => import("@/locales/ne.json").then((m) => m.default as Dict),
  or: () => import("@/locales/or.json").then((m) => m.default as Dict),
  pa: () => import("@/locales/pa.json").then((m) => m.default as Dict),
  sa: () => import("@/locales/sa.json").then((m) => m.default as Dict),
  sat: () => import("@/locales/sat.json").then((m) => m.default as Dict),
  sd: () => import("@/locales/sd.json").then((m) => m.default as Dict),
  ta: () => import("@/locales/ta.json").then((m) => m.default as Dict),
  te: () => import("@/locales/te.json").then((m) => m.default as Dict),
  ur: () => import("@/locales/ur.json").then((m) => m.default as Dict),
};

/** Module-level memo so each dictionary is fetched at most once. */
const loaded: Partial<Record<Locale, Dict>> = { en };

function loadDict(code: Locale): Promise<Dict> {
  const cached = loaded[code];
  if (cached) return Promise.resolve(cached);
  return loaders[code]().then((dict) => {
    loaded[code] = dict;
    return dict;
  });
}

type LanguageContextValue = {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  /** Translate a key in the active language, falling back to English. */
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server renders "en" (matches SSR HTML → no hydration mismatch). The
  // stored preference is applied right after mount.
  const [language, setLanguageState] = useState<Locale>(FALLBACK_LOCALE);
  const [dictionaries, setDictionaries] = useState<Partial<Record<Locale, Dict>>>({ en });

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored) && stored !== "en") {
      setLanguageState(stored);
      void loadDict(stored).then((dict) =>
        setDictionaries((prev) => (prev[stored] === dict ? prev : { ...prev, [stored]: dict })),
      );
    }
  }, []);

  const setLanguage = useCallback((lang: Locale) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
    if (lang !== "en") {
      // Kick off the lazy fetch; the UI keeps working via English fallback
      // (or the previous dict) until the chunk arrives.
      void loadDict(lang).then((dict) =>
        setDictionaries((prev) => (prev[lang] === dict ? prev : { ...prev, [lang]: dict })),
      );
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const active = dictionaries[language] ?? dictionaries.en;
      return active?.[key] ?? en[key] ?? key;
    },
    [language, dictionaries],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

/** Access the active language, its setter, and the t() translator. */
export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within a <LanguageProvider>");
  }
  return ctx;
}
