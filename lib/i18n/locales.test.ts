import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Every supported locale — mirrors LOCALES in lib/i18n/LanguageContext.tsx.
const LOCALE_FILES = [
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

function loadLocale(code: string): Record<string, string> {
  const file = resolve(process.cwd(), "locales", `${code}.json`);
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
}

describe("locale dictionaries", () => {
  const en = loadLocale("en");
  const enKeys = Object.keys(en).sort();

  it("covers every supported locale", () => {
    for (const code of LOCALE_FILES) {
      expect(() => loadLocale(code), `missing locales/${code}.json`).not.toThrow();
    }
  });

  it("has no duplicate keys in the English source", () => {
    expect(new Set(enKeys).size).toBe(enKeys.length);
  });

  it("every locale has exactly the same keys as en.json (no missing, no extra)", () => {
    for (const code of LOCALE_FILES) {
      const keys = Object.keys(loadLocale(code)).sort();
      expect(keys, `${code}.json keys differ from en.json`).toEqual(enKeys);
    }
  });

  it("every value is a non-empty string", () => {
    for (const code of LOCALE_FILES) {
      const dict = loadLocale(code);
      for (const key of enKeys) {
        expect(
          dict[key],
          `${code}.json: "${key}" is empty`,
        ).toBeTruthy();
      }
    }
  });
});
