// ---------------------------------------------------------------------
// lib/mock-data/alert-preferences.test.ts
// Locks the citizen alert-preferences model: defaults, storage round-
// trip, corrupt/missing payload tolerance, and the preference-based
// feed filter (Phase 3 · Step 5).
// ---------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ALERT_PREFERENCES,
  filterAlertsByPreferences,
  parseAlertPreferences,
  readAlertPreferences,
  writeAlertPreferences,
  type AlertPreferences,
} from "./alert-preferences";
import { PUBLIC_ALERTS } from "./public-alerts";

/** Minimal in-memory localStorage for node (the storage helpers guard
 * on `window`, so it must exist to exercise the read/write paths). */
function stubLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  vi.stubGlobal("window", { localStorage } as unknown as Window & typeof globalThis);
  return store;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("defaults + parsing", () => {
  it("defaults to every type on, severity all, quiet hours off", () => {
    expect(DEFAULT_ALERT_PREFERENCES.types).toEqual({
      flood: true,
      cyclone: true,
      earthquake: true,
    });
    expect(DEFAULT_ALERT_PREFERENCES.severity).toBe("all");
    expect(DEFAULT_ALERT_PREFERENCES.quietHours).toBe(false);
  });

  it("returns defaults for missing storage", () => {
    stubLocalStorage();
    expect(readAlertPreferences()).toEqual(DEFAULT_ALERT_PREFERENCES);
  });

  it("returns defaults for corrupt JSON", () => {
    stubLocalStorage();
    writeAlertPreferences(DEFAULT_ALERT_PREFERENCES);
    // Overwrite the stored value with garbage.
    const win = window as unknown as { localStorage: Storage };
    win.localStorage.setItem("citizen_alert_preferences", "{not json");
    expect(readAlertPreferences()).toEqual(DEFAULT_ALERT_PREFERENCES);
  });

  it("merges partial payloads over defaults", () => {
    const partial = parseAlertPreferences(
      JSON.stringify({ types: { flood: false }, severity: "critical" }),
    );
    expect(partial.types.flood).toBe(false);
    expect(partial.types.cyclone).toBe(true);
    expect(partial.severity).toBe("critical");
    expect(partial.quietHours).toBe(false);
  });

  it("rejects unknown severity values", () => {
    const parsed = parseAlertPreferences(JSON.stringify({ severity: "urgent" }));
    expect(parsed.severity).toBe("all");
  });
});

describe("read/write round-trip", () => {
  it("persists and reloads the exact preferences", () => {
    stubLocalStorage();
    const prefs: AlertPreferences = {
      types: { flood: false, cyclone: true, earthquake: false },
      severity: "watch-critical",
      quietHours: true,
    };
    writeAlertPreferences(prefs);
    expect(readAlertPreferences()).toEqual(prefs);
  });
});

describe("filterAlertsByPreferences", () => {
  it("returns the full feed with defaults", () => {
    expect(filterAlertsByPreferences(PUBLIC_ALERTS, DEFAULT_ALERT_PREFERENCES)).toEqual(
      PUBLIC_ALERTS,
    );
  });

  it("hides flood alerts when Floods is disabled (rain/road stay)", () => {
    const prefs: AlertPreferences = {
      ...DEFAULT_ALERT_PREFERENCES,
      types: { ...DEFAULT_ALERT_PREFERENCES.types, flood: false },
    };
    const filtered = filterAlertsByPreferences(PUBLIC_ALERTS, prefs);
    expect(filtered.length).toBe(3);
    expect(filtered.some((a) => a.type === "flood")).toBe(false);
  });

  it("shows only critical when severity is 'critical'", () => {
    const prefs: AlertPreferences = {
      ...DEFAULT_ALERT_PREFERENCES,
      severity: "critical",
    };
    const filtered = filterAlertsByPreferences(PUBLIC_ALERTS, prefs);
    expect(filtered.every((a) => a.severity === "critical")).toBe(true);
  });

  it("shows warning + critical (not advisory) when severity is 'watch-critical'", () => {
    const prefs: AlertPreferences = {
      ...DEFAULT_ALERT_PREFERENCES,
      severity: "watch-critical",
    };
    const filtered = filterAlertsByPreferences(PUBLIC_ALERTS, prefs);
    expect(filtered.every((a) => a.severity !== "safe")).toBe(true);
    expect(filtered.some((a) => a.severity === "warning")).toBe(true);
  });
});
