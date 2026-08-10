// ---------------------------------------------------------------------
// lib/mock-data/public-alerts.test.ts
// Locks the citizen alerts feed: shape invariants (ids unique, types/
// severities/scopes valid, timestamps parseable), the Step 1 filter
// behaviour (every tab non-empty so the demo never looks dead), and the
// relative-time label formatting.
// ---------------------------------------------------------------------

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALERT_FILTERS,
  PUBLIC_ALERTS,
  cacheAlerts,
  createSimulatedOfficialAlert,
  filterAlertsByScope,
  formatCachedAt,
  isPublicAlert,
  readCachedAlerts,
  relativeTime,
  type PublicAlertScope,
  type PublicAlertSeverity,
  type PublicAlertType,
} from "./public-alerts";

/** Minimal in-memory localStorage for node (cache helpers guard on window). */
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

const TYPES: PublicAlertType[] = ["flood", "rain", "road"];
const SEVERITIES: PublicAlertSeverity[] = ["safe", "warning", "critical"];
const SCOPES: PublicAlertScope[] = ["my-area", "district", "state"];

describe("PUBLIC_ALERTS", () => {
  it("has at least 3 alerts (the spec's minimum)", () => {
    expect(PUBLIC_ALERTS.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique ids", () => {
    const ids = PUBLIC_ALERTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses only valid types, severities and scopes", () => {
    for (const alert of PUBLIC_ALERTS) {
      expect(TYPES).toContain(alert.type);
      expect(SEVERITIES).toContain(alert.severity);
      expect(SCOPES).toContain(alert.scope);
    }
  });

  it("has parseable ISO timestamps", () => {
    for (const alert of PUBLIC_ALERTS) {
      expect(Number.isNaN(new Date(alert.timestamp).getTime())).toBe(false);
    }
  });

  it("has at least one recommended action per alert", () => {
    for (const alert of PUBLIC_ALERTS) {
      expect(alert.actions.length).toBeGreaterThan(0);
      expect(alert.actions.every((a) => a.trim() !== "")).toBe(true);
    }
  });

  it("has valid provenance + vote fields (Phase 3 · Step 8)", () => {
    for (const alert of PUBLIC_ALERTS) {
      expect(typeof alert.isOfficial).toBe("boolean");
      expect(Number.isInteger(alert.upvotes) && alert.upvotes >= 0).toBe(true);
      expect(Number.isInteger(alert.downvotes) && alert.downvotes >= 0).toBe(true);
    }
    // Both badge types exist in the demo feed so judges see both.
    expect(PUBLIC_ALERTS.some((a) => a.isOfficial)).toBe(true);
    expect(PUBLIC_ALERTS.some((a) => !a.isOfficial)).toBe(true);
  });

  it("every mock alert passes the full-shape type guard", () => {
    for (const alert of PUBLIC_ALERTS) {
      expect(isPublicAlert(alert)).toBe(true);
    }
  });

  it("covers every severity and type at least once", () => {
    for (const t of TYPES) {
      expect(PUBLIC_ALERTS.some((a) => a.type === t)).toBe(true);
    }
    for (const s of SEVERITIES) {
      expect(PUBLIC_ALERTS.some((a) => a.severity === s)).toBe(true);
    }
  });
});

describe("filterAlertsByScope", () => {
  it("returns the input unchanged for 'all'", () => {
    expect(filterAlertsByScope(PUBLIC_ALERTS, "all")).toBe(PUBLIC_ALERTS);
  });

  it("only returns alerts of the requested scope", () => {
    for (const scope of SCOPES) {
      const filtered = filterAlertsByScope(PUBLIC_ALERTS, scope);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((a) => a.scope === scope)).toBe(true);
    }
  });

  it("keeps every filter tab non-empty (demo never looks dead)", () => {
    for (const { key } of ALERT_FILTERS) {
      expect(filterAlertsByScope(PUBLIC_ALERTS, key).length).toBeGreaterThan(0);
    }
  });
});

describe("offline cache (Phase 3 · Step 7)", () => {
  it("round-trips the feed through localStorage", () => {
    stubLocalStorage();
    cacheAlerts(PUBLIC_ALERTS);
    const cached = readCachedAlerts();
    expect(cached.alerts).toEqual(PUBLIC_ALERTS);
    expect(typeof cached.cachedAt).toBe("string");
  });

  it("returns null alerts for corrupt cache data", () => {
    stubLocalStorage();
    const win = window as unknown as { localStorage: Storage };
    win.localStorage.setItem("drip:cached-alerts", "{nope");
    const cached = readCachedAlerts();
    expect(cached.alerts).toBeNull();
  });

  it("rejects a partial cache missing required fields (e.g. actions)", () => {
    stubLocalStorage();
    const win = window as unknown as { localStorage: Storage };
    // Stale shape from an older cache version — must not reach the UI,
    // where AlertCard/AlertDetailModal would crash on the missing fields.
    win.localStorage.setItem(
      "drip:cached-alerts",
      JSON.stringify([{ id: "x", title: "Broken entry" }]),
    );
    expect(readCachedAlerts().alerts).toBeNull();
  });

  it("returns null when nothing was cached yet", () => {
    stubLocalStorage();
    expect(readCachedAlerts().alerts).toBeNull();
  });
});

describe("createSimulatedOfficialAlert (Phase 3 · Step 10)", () => {
  it("produces a valid official alert with a fresh timestamp", () => {
    const alert = createSimulatedOfficialAlert();
    expect(isPublicAlert(alert)).toBe(true);
    expect(alert.isOfficial).toBe(true);
    expect(alert.id.startsWith("sim-")).toBe(true);
    expect(relativeTime(alert.timestamp)).toBe("just now");
  });
});

describe("formatCachedAt", () => {
  it("returns null for null/invalid input", () => {
    expect(formatCachedAt(null)).toBeNull();
    expect(formatCachedAt("not-a-date")).toBeNull();
  });

  it("formats a valid ISO timestamp as HH:MM", () => {
    const label = formatCachedAt("2026-08-10T14:05:00.000Z");
    expect(label).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-08-10T12:00:00Z").getTime();

  it("says 'just now' under a minute", () => {
    const iso = new Date(now - 30_000).toISOString();
    expect(relativeTime(iso, now)).toBe("just now");
  });

  it("formats minutes", () => {
    const iso = new Date(now - 5 * 60_000).toISOString();
    expect(relativeTime(iso, now)).toBe("5m ago");
  });

  it("formats hours", () => {
    const iso = new Date(now - 2 * 3_600_000).toISOString();
    expect(relativeTime(iso, now)).toBe("2h ago");
  });

  it("falls back to a short date past 24 hours", () => {
    const iso = new Date(now - 10 * 86_400_000).toISOString();
    const label = relativeTime(iso, now);
    expect(label).toMatch(/\d{1,2} \w+/);
  });

  it("returns '' for unparseable input", () => {
    expect(relativeTime("not-a-date", now)).toBe("");
  });
});
