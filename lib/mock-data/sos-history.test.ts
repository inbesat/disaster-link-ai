// ---------------------------------------------------------------------
// lib/mock-data/sos-history.test.ts — Phase 5 · Step 7 timeline data.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { SOS_HISTORY, formatSosDate } from "./sos-history";

describe("SOS_HISTORY", () => {
  it("has at least 3 documented incidents", () => {
    expect(SOS_HISTORY.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique ids", () => {
    const ids = SOS_HISTORY.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has parseable ISO dates and non-empty type/status/location", () => {
    for (const entry of SOS_HISTORY) {
      expect(Number.isNaN(new Date(entry.date).getTime())).toBe(false);
      expect(entry.incidentType.trim()).not.toBe("");
      expect(entry.status.trim()).not.toBe("");
      expect(entry.location.trim()).not.toBe("");
      expect(entry.summary.trim()).not.toBe("");
    }
  });

  it("is sorted newest-first", () => {
    for (let i = 1; i < SOS_HISTORY.length; i++) {
      expect(new Date(SOS_HISTORY[i].date).getTime()).toBeLessThanOrEqual(
        new Date(SOS_HISTORY[i - 1].date).getTime(),
      );
    }
  });
});

describe("formatSosDate", () => {
  it("formats a valid ISO date as a readable label", () => {
    const label = formatSosDate("2026-08-02T09:15:00.000Z");
    // Locale order varies across ICU builds ("2 Aug 2026" vs "Aug 2, 2026")
    // — assert the pieces, not the exact arrangement.
    expect(label).toContain("Aug");
    expect(label).toContain("2026");
    expect(label).toMatch(/\d/);
  });

  it("falls back to the raw string when unparseable", () => {
    expect(formatSosDate("not-a-date")).toBe("not-a-date");
  });
});
