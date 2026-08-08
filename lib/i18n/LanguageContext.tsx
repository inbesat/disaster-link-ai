"use client";

// ---------------------------------------------------------------------
// lib/i18n/LanguageContext.tsx — lightweight i18n (Phase 25 · Step 3).
//
// Manages the active UI language (en / hi / ml), persists the choice to
// localStorage ("preferred_lang"), and exposes a typed t(key) translator
// that reads from the dictionaries in /locales. Missing keys fall back to
// the English string (and finally to the key itself).
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
import hi from "@/locales/hi.json";
import ml from "@/locales/ml.json";

export type Locale = "en" | "hi" | "ml";

/** The known translation keys — derived from the English dictionary. */
export type TranslationKey = keyof typeof en;

const LOCALES: Locale[] = ["en", "hi", "ml"];
const STORAGE_KEY = "preferred_lang";
const FALLBACK_LOCALE: Locale = "en";

const dictionaries = { en, hi, ml } as Record<Locale, Record<string, string>>;

function isLocale(value: string | null): value is Locale {
  return value !== null && (LOCALES as string[]).includes(value);
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

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) setLanguageState(stored);
  }, []);

  const setLanguage = useCallback((lang: Locale) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, lang);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const active = dictionaries[language];
      const english = dictionaries.en;
      return active[key] ?? english[key] ?? key;
    },
    [language],
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
