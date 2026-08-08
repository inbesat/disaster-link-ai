// ---------------------------------------------------------------------
// lib/i18n/locales.ts — canonical registry of every supported UI language.
//
// English + the 22 scheduled languages of India (Eighth Schedule) = 23
// languages total. This module is framework-agnostic (no React, no "use
// client") so BOTH client components (LanguageContext, LanguageSelector)
// and server code (Zod validation, server actions, the SMS alert engine)
// can import it as a single source of truth.
// ---------------------------------------------------------------------

export const LOCALE_CODES = [
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
] as const;

export type Locale = (typeof LOCALE_CODES)[number];

/** Native names shown in the language selector dropdown. */
export const LOCALE_OPTIONS: { code: Locale; nativeLabel: string }[] = [
  { code: "en", nativeLabel: "English" },
  { code: "hi", nativeLabel: "हिन्दी" },
  { code: "ml", nativeLabel: "മലയാളം" },
  { code: "as", nativeLabel: "অসমীয়া" },
  { code: "bn", nativeLabel: "বাংলা" },
  { code: "brx", nativeLabel: "बड़ो" },
  { code: "doi", nativeLabel: "डोगरी" },
  { code: "gu", nativeLabel: "ગુજરાતી" },
  { code: "kn", nativeLabel: "ಕನ್ನಡ" },
  { code: "ks", nativeLabel: "कॉशुर" },
  { code: "kok", nativeLabel: "कोंकणी" },
  { code: "mai", nativeLabel: "मैथिली" },
  { code: "mni", nativeLabel: "মৈতৈলোন্" },
  { code: "mr", nativeLabel: "मराठी" },
  { code: "ne", nativeLabel: "नेपाली" },
  { code: "or", nativeLabel: "ଓଡ଼ିଆ" },
  { code: "pa", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "sa", nativeLabel: "संस्कृतम्" },
  { code: "sat", nativeLabel: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "sd", nativeLabel: "سنڌي" },
  { code: "ta", nativeLabel: "தமிழ்" },
  { code: "te", nativeLabel: "తెలుగు" },
  { code: "ur", nativeLabel: "اردو" },
];

/** English name per code — used in AI translation prompts and logs. */
export const LOCALE_ENGLISH_NAMES: Record<Locale, string> = {
  en: "English",
  as: "Assamese",
  bn: "Bengali",
  brx: "Bodo",
  doi: "Dogri",
  gu: "Gujarati",
  hi: "Hindi",
  kn: "Kannada",
  ks: "Kashmiri",
  kok: "Konkani",
  mai: "Maithili",
  ml: "Malayalam",
  mni: "Manipuri",
  mr: "Marathi",
  ne: "Nepali",
  or: "Odia",
  pa: "Punjabi",
  sa: "Sanskrit",
  sat: "Santali",
  sd: "Sindhi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return value !== null && value !== undefined && (LOCALE_CODES as readonly string[]).includes(value);
}

export function toLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : "en";
}
