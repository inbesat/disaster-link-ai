"use client";

// ---------------------------------------------------------------------
// lib/i18n/LanguageContext.tsx — lightweight i18n (Phase 25).
//
// Manages the active UI language and persists the choice to localStorage
// ("preferred_lang"). Covers English + the 21 scheduled languages of
// India (Eighth Schedule). Missing keys fall back to the English string
// (and finally to the key itself).
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
import as from "@/locales/as.json";
import bn from "@/locales/bn.json";
import brx from "@/locales/brx.json";
import doi from "@/locales/doi.json";
import gu from "@/locales/gu.json";
import kn from "@/locales/kn.json";
import ks from "@/locales/ks.json";
import kok from "@/locales/kok.json";
import mai from "@/locales/mai.json";
import mni from "@/locales/mni.json";
import mr from "@/locales/mr.json";
import ne from "@/locales/ne.json";
import or from "@/locales/or.json";
import pa from "@/locales/pa.json";
import sa from "@/locales/sa.json";
import sat from "@/locales/sat.json";
import sd from "@/locales/sd.json";
import ta from "@/locales/ta.json";
import te from "@/locales/te.json";
import ur from "@/locales/ur.json";

/** Every supported UI language (English + 21 Indian scheduled languages). */
export type Locale =
  | "en"
  | "hi"
  | "ml"
  | "as"
  | "bn"
  | "brx"
  | "doi"
  | "gu"
  | "kn"
  | "ks"
  | "kok"
  | "mai"
  | "mni"
  | "mr"
  | "ne"
  | "or"
  | "pa"
  | "sa"
  | "sat"
  | "sd"
  | "ta"
  | "te"
  | "ur";

/** The known translation keys — derived from the English dictionary. */
export type TranslationKey = keyof typeof en;

export const LOCALES: Locale[] = [
  "en",
  "as",
  "bn",
  "brx",
  "doi",
  "gu",
  "hi",
  "kn",
  "ks",
  "kok",
  "mai",
  "ml",
  "mni",
  "mr",
  "ne",
  "or",
  "pa",
  "sa",
  "sat",
  "sd",
  "ta",
  "te",
  "ur",
];

const STORAGE_KEY = "preferred_lang";
const FALLBACK_LOCALE: Locale = "en";

const dictionaries = {
  en,
  as,
  bn,
  brx,
  doi,
  gu,
  hi,
  kn,
  ks,
  kok,
  mai,
  ml,
  mni,
  mr,
  ne,
  or,
  pa,
  sa,
  sat,
  sd,
  ta,
  te,
  ur,
} as Record<Locale, Record<string, string>>;

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
