// ---------------------------------------------------------------------
// lib/pwa/pwa-utils.test.ts — Phase 13 · Step 3 · PWA plumbing tests
// (node-only vitest env — every helper takes its dependencies injected).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  PWA_STORAGE_KEYS,
  detectPwaSupport,
  detectStandalone,
  isBeforeInstallPromptEvent,
  readInstallDismissed,
  readUpdateDismissed,
  writeInstallDismissed,
  writeUpdateDismissed,
} from "./pwa-utils";

/** In-memory Storage stand-in (localStorage-shaped). */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => {
      map.delete(key);
    },
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
  } as Storage;
}

describe("readInstallDismissed / writeInstallDismissed", () => {
  it("defaults to NOT dismissed", () => {
    expect(readInstallDismissed(memoryStorage())).toBe(false);
  });

  it("round-trips a dismissal", () => {
    const storage = memoryStorage();
    writeInstallDismissed(true, storage);
    expect(readInstallDismissed(storage)).toBe(true);
    expect(storage.getItem(PWA_STORAGE_KEYS.installDismissed)).toBe("true");
  });

  it("removes the key when un-dismissing", () => {
    const storage = memoryStorage();
    writeInstallDismissed(true, storage);
    writeInstallDismissed(false, storage);
    expect(readInstallDismissed(storage)).toBe(false);
    expect(storage.getItem(PWA_STORAGE_KEYS.installDismissed)).toBeNull();
  });

  it("never throws with a null storage (SSR path)", () => {
    expect(() => writeInstallDismissed(true, null)).not.toThrow();
    expect(readInstallDismissed(null)).toBe(false);
  });
});

describe("readUpdateDismissed / writeUpdateDismissed", () => {
  it("scopes dismissals per update key — a later release can prompt again", () => {
    const storage = memoryStorage();
    writeUpdateDismissed("install-1000", true, storage);
    expect(readUpdateDismissed("install-1000", storage)).toBe(true);
    expect(readUpdateDismissed("install-2000", storage)).toBe(false);
  });

  it("removes the key when re-allowing", () => {
    const storage = memoryStorage();
    writeUpdateDismissed("install-1000", true, storage);
    writeUpdateDismissed("install-1000", false, storage);
    expect(readUpdateDismissed("install-1000", storage)).toBe(false);
  });
});

describe("detectStandalone", () => {
  it("is standalone via the display-mode media query", () => {
    expect(
      detectStandalone(() => ({ matches: true }), undefined),
    ).toBe(true);
    expect(
      detectStandalone(() => ({ matches: false }), undefined),
    ).toBe(false);
  });

  it("is standalone via iOS navigator.standalone", () => {
    expect(detectStandalone(() => ({ matches: false }), true)).toBe(true);
    expect(detectStandalone(() => ({ matches: false }), "yes")).toBe(false);
  });

  it("is NOT standalone when matchMedia is unavailable (SSR / old browser)", () => {
    expect(detectStandalone(null, undefined)).toBe(false);
  });

  it("is NOT standalone when matchMedia itself throws (private mode edge)", () => {
    expect(
      detectStandalone(
        () => {
          throw new Error("matchMedia unavailable");
        },
        undefined,
      ),
    ).toBe(false);
  });
});

describe("detectPwaSupport", () => {
  it("reports false outside a browser (SSR path — no window)", () => {
    // The node test env has no `window`, so the SSR guard must win.
    expect(detectPwaSupport()).toBe(false);
  });
});

describe("isBeforeInstallPromptEvent", () => {
  it("accepts a conforming beforeinstallprompt-shaped object", () => {
    const event = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    };
    expect(isBeforeInstallPromptEvent(event)).toBe(true);
  });

  it("rejects non-events and events without a prompt()", () => {
    expect(isBeforeInstallPromptEvent(null)).toBe(false);
    expect(isBeforeInstallPromptEvent({})).toBe(false);
    expect(isBeforeInstallPromptEvent({ prompt: "not a function" })).toBe(false);
    expect(isBeforeInstallPromptEvent(42)).toBe(false);
  });
});
