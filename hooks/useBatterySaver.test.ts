// ---------------------------------------------------------------------
// hooks/useBatterySaver.test.ts — Phase 13 · Step 8 · battery-saver logic.
// navigator.getBattery() doesn't exist in node, so the pure helpers
// (threshold + manager normalisation) are tested here; the live UI
// behaviour is exercised in the browser checks.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  DEFAULT_BATTERY_SNAPSHOT,
  batterySnapshotFromManager,
  isLowBatteryLevel,
} from "./useBatterySaver";

describe("isLowBatteryLevel (20% threshold)", () => {
  it("flags anything under 20%", () => {
    expect(isLowBatteryLevel(0)).toBe(true);
    expect(isLowBatteryLevel(0.19)).toBe(true);
    expect(isLowBatteryLevel(0.199)).toBe(true);
  });

  it("is NOT low at exactly 20% or above", () => {
    expect(isLowBatteryLevel(0.2)).toBe(false);
    expect(isLowBatteryLevel(0.5)).toBe(false);
    expect(isLowBatteryLevel(1)).toBe(false);
  });
});

describe("batterySnapshotFromManager (defensive normalisation)", () => {
  it("maps a 12% charge to isBatteryLow with the raw level", () => {
    const out = batterySnapshotFromManager({
      level: 0.12,
      charging: false,
      addEventListener() {},
      removeEventListener() {},
    });
    expect(out).toEqual({
      isBatteryLow: true,
      level: 0.12,
      charging: false,
      supported: true,
    });
  });

  it("reports healthy when charging above the threshold", () => {
    const out = batterySnapshotFromManager({
      level: 0.86,
      charging: true,
      addEventListener() {},
      removeEventListener() {},
    });
    expect(out.isBatteryLow).toBe(false);
    expect(out.charging).toBe(true);
    expect(out.level).toBe(0.86);
  });

  it("treats a NaN/absent level as unknown (healthy, level 1)", () => {
    const out = batterySnapshotFromManager({
      level: Number.NaN,
      charging: false,
      addEventListener() {},
      removeEventListener() {},
    });
    expect(out).toEqual({
      isBatteryLow: false,
      level: 1,
      charging: false,
      supported: true,
    });
  });
});

describe("DEFAULT_BATTERY_SNAPSHOT", () => {
  it("is the safe pre-API state (not low, unsupported)", () => {
    expect(DEFAULT_BATTERY_SNAPSHOT).toEqual({
      isBatteryLow: false,
      level: 1,
      charging: true,
      supported: false,
    });
  });
});
