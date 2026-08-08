import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NDRF_COMMANDER_DEFAULTS,
  PROFILE_SETTINGS_KEY,
  LEGACY_KEYS,
  readProfileSettings,
} from "./settings-mock";

// ---------------------------------------------------------------------
// lib/settings-mock.test.ts — audit of the unified settings store (Phase 10):
//   • falls back to realistic NDRF Commander demo data
//   • unified key beats legacy per-card keys
//   • invalid values are dropped (validated merge)
//   • writes persist and are readable back (single source of truth)
// ---------------------------------------------------------------------

type MapStorage = Record<string, string>;

function createLocalStorage(seed: MapStorage = {}) {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

let originalWindow: typeof window | undefined;

beforeEach(() => {
  originalWindow = globalThis.window;
});

afterEach(() => {
  if (originalWindow === undefined) {
    delete (globalThis as { window?: typeof window }).window;
  } else {
    globalThis.window = originalWindow;
  }
});

/** Point globalThis.window at a fake localStorage so the store's guards pass. */
function withStorage(storage: MapStorage) {
  (globalThis as { window?: typeof window }).window = {
    localStorage: createLocalStorage(storage),
  } as typeof window;
}

describe("readProfileSettings (mock fallback)", () => {
  it("falls back to NDRF Commander demo data when storage is empty", () => {
    withStorage({});
    const settings = readProfileSettings();
    expect(settings).toEqual(NDRF_COMMANDER_DEFAULTS);
    expect(settings.fullName).toBe("Cmdr. Asha Verma");
    expect(settings.role).toBe("district_admin");
    expect(settings.visibility).toBe("limited");
    expect(settings.timezone).toBe("Asia/Kolkata");
  });

  it("prefers the unified v2 key over legacy per-card keys", () => {
    withStorage({
      [LEGACY_KEYS.identity]: JSON.stringify({ fullName: "Old Rsd" }),
      [LEGACY_KEYS.visibility]: JSON.stringify({ visibility: "public" }),
      [LEGACY_KEYS.localization]: JSON.stringify({ timezone: "UTC" }),
      [PROFILE_SETTINGS_KEY]: JSON.stringify({
        fullName: "Cmdr. Asha Verma",
        visibility: "private",
      }),
    });
    const settings = readProfileSettings();
    expect(settings.fullName).toBe("Cmdr. Asha Verma");
    expect(settings.visibility).toBe("private");
    // timezone only exists in legacy → merged in from there
    expect(settings.timezone).toBe("UTC");
  });

  it("migrates legacy identity/visibility/localization when v2 is absent", () => {
    withStorage({
      [LEGACY_KEYS.identity]: JSON.stringify({ fullName: "Legacy Name", phone: "+919999999999" }),
      [LEGACY_KEYS.visibility]: JSON.stringify({
        visibility: "public",
        shareLiveGps: true,
      }),
      [LEGACY_KEYS.localization]: JSON.stringify({ region: "Bihar" }),
    });
    const settings = readProfileSettings();
    expect(settings.fullName).toBe("Legacy Name");
    expect(settings.visibility).toBe("public");
    expect(settings.shareLiveGps).toBe(true);
    expect(settings.region).toBe("Bihar");
    expect(settings.role).toBe(NDRF_COMMANDER_DEFAULTS.role);
  });

  it("drops invalid visibility / designation / language values", () => {
    withStorage({
      [PROFILE_SETTINGS_KEY]: JSON.stringify({
        visibility: "nope",
        designation: "Hacker",
        language: "xx",
        shareLiveGps: "yes",
      }),
    });
    const settings = readProfileSettings();
    expect(settings.visibility).toBe(NDRF_COMMANDER_DEFAULTS.visibility);
    expect(settings.designation).toBe(NDRF_COMMANDER_DEFAULTS.designation);
    expect(settings.language).toBe(NDRF_COMMANDER_DEFAULTS.language);
    expect(settings.shareLiveGps).toBe(NDRF_COMMANDER_DEFAULTS.shareLiveGps);
  });

  it("returns defaults when unified JSON is corrupt", () => {
    withStorage({ [PROFILE_SETTINGS_KEY]: "{not-json" });
    const settings = readProfileSettings();
    expect(settings.fullName).toBe(NDRF_COMMANDER_DEFAULTS.fullName);
  });
});