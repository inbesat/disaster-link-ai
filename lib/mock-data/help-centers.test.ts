// ---------------------------------------------------------------------
// lib/mock-data/help-centers.test.ts — Phase 1 · Step 4 · Center directory
// data + helpers tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  CENTER_FILTERS,
  CENTER_TYPE_EMOJI,
  filterHelpCenters,
  HELP_CENTERS,
  plotHelpCenters,
} from "./help-centers";

describe("HELP_CENTERS", () => {
  it("covers all four center types", () => {
    const types = new Set(HELP_CENTERS.map((c) => c.type));
    expect(types).toEqual(new Set(["ndrf", "police", "hospital", "fire"]));
  });

  it("every center has an emoji, status, hours and phone", () => {
    for (const center of HELP_CENTERS) {
      expect(CENTER_TYPE_EMOJI[center.type]).toBeTruthy();
      expect(["open", "overloaded"]).toContain(center.status);
      expect(center.hours).toBeTruthy();
      expect(center.phone).toMatch(/^\+?\d[\d-]*$/);
      expect(center.tags.length).toBeGreaterThan(0);
    }
  });
});

describe("filterHelpCenters", () => {
  it("returns every center for the 'all' filter", () => {
    expect(filterHelpCenters(HELP_CENTERS, "all")).toHaveLength(
      HELP_CENTERS.length,
    );
  });

  it("filters by medical / 24-7 / rescue tags", () => {
    const medical = filterHelpCenters(HELP_CENTERS, "medical");
    expect(medical.every((c) => c.tags.includes("medical"))).toBe(true);

    const roundTheClock = filterHelpCenters(HELP_CENTERS, "247");
    expect(roundTheClock.every((c) => c.tags.includes("247"))).toBe(true);

    const rescue = filterHelpCenters(HELP_CENTERS, "rescue");
    expect(rescue.every((c) => c.tags.includes("rescue"))).toBe(true);
  });
});

describe("CENTER_FILTERS", () => {
  it("starts with the All chip", () => {
    expect(CENTER_FILTERS[0]).toEqual({ key: "all", label: "All" });
  });
});

describe("plotHelpCenters", () => {
  it("returns one point per center with 0–100 percentages", () => {
    const points = plotHelpCenters(HELP_CENTERS);
    expect(points).toHaveLength(HELP_CENTERS.length);
    for (const { x, y } of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  it("returns an empty array for no centers", () => {
    expect(plotHelpCenters([])).toEqual([]);
  });
});
