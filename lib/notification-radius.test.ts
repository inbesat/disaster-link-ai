import { describe, expect, it } from "vitest";
import {
  DEFAULT_RADIUS_INDEX,
  RADIUS_OPTIONS,
  radiusHelperText,
  withinRadius,
} from "./notification-radius";

// ---------------------------------------------------------------------
// lib/notification-radius.test.ts — geospatial radius audit (Step 5):
//   • snap points cover 5km → All India with matching helper copy
//   • helper text updates per index and matches the requested phrasing
//   • withinRadius filters km options and passes distract/india always
// ---------------------------------------------------------------------

describe("radius options", () => {
  it("exposes six snap points including District-Wide and All India", () => {
    expect(RADIUS_OPTIONS.map((o) => o.label)).toEqual([
      "5 km",
      "10 km",
      "25 km",
      "50 km",
      "District-Wide",
      "All India",
    ]);
    expect(RADIUS_OPTIONS[5].km).toBeNull();
    expect(RADIUS_OPTIONS[4].km).toBeNull();
  });

  it("defaults to 50 km", () => {
    expect(DEFAULT_RADIUS_INDEX).toBe(3);
    expect(RADIUS_OPTIONS[DEFAULT_RADIUS_INDEX].label).toBe("50 km");
  });
});

describe("radiusHelperText", () => {
  it("wraps the requested copy for finite km options", () => {
    expect(radiusHelperText(1)).toBe(
      "You will only receive alerts for events within 10km of your current live GPS location.",
    );
    expect(radiusHelperText(3)).toBe(
      "You will only receive alerts for events within 50km of your current live GPS location.",
    );
  });

  it("swaps in 'anywhere in India' for the All India snap", () => {
    expect(radiusHelperText(5)).toBe(
      "You will only receive alerts for events anywhere in India.",
    );
  });

  it("handles out-of-range indexes defensively", () => {
    expect(radiusHelperText(99)).toBe(
      "You will only receive alerts for events within 5km of your current live GPS location.",
    );
  });
});

describe("withinRadius", () => {
  it("routes events at or inside the selected radius", () => {
    expect(withinRadius(RADIUS_OPTIONS[1], 10)).toBe(true);
    expect(withinRadius(RADIUS_OPTIONS[1], 10.5)).toBe(false);
    expect(withinRadius(RADIUS_OPTIONS[0], 5)).toBe(true);
    expect(withinRadius(RADIUS_OPTIONS[0], 6)).toBe(false);
  });

  it("passes anything for District-Wide and All India", () => {
    expect(withinRadius(RADIUS_OPTIONS[4], 10_000)).toBe(true);
    expect(withinRadius(RADIUS_OPTIONS[5], 1_000_000)).toBe(true);
  });
});