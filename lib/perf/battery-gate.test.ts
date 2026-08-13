// ---------------------------------------------------------------------
// lib/perf/battery-gate.test.ts — Phase 10 battery-aware sync gating
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  shouldPauseSyncForBattery,
  batteryAllowsSync,
  batteryRetryDelayMs,
  BATTERY_SYNC_PAUSE_THRESHOLD,
  type BatteryGateState,
} from "./battery-gate";

const state = (overrides: Partial<BatteryGateState> = {}): BatteryGateState => ({
  level: 0.5,
  charging: false,
  supported: true,
  ...overrides,
});

describe("shouldPauseSyncForBattery", () => {
  it("pauses sync below the 20% threshold when not charging", () => {
    expect(shouldPauseSyncForBattery(state({ level: 0.15 }))).toBe(true);
    expect(shouldPauseSyncForBattery(state({ level: 0.1 }))).toBe(true);
  });

  it("does not pause above 20%", () => {
    expect(shouldPauseSyncForBattery(state({ level: 0.25 }))).toBe(false);
    expect(shouldPauseSyncForBattery(state({ level: 0.2 }))).toBe(false); // boundary inclusive
  });

  it("charging overrides the low-battery pause", () => {
    expect(shouldPauseSyncForBattery(state({ level: 0.05, charging: true }))).toBe(false);
  });

  it("never pauses when the battery API is unsupported", () => {
    expect(shouldPauseSyncForBattery(state({ supported: false, level: 0.01 }))).toBe(false);
  });

  it("BATTERY_SYNC_PAUSE_THRESHOLD is exactly 0.2 (spec)", () => {
    expect(BATTERY_SYNC_PAUSE_THRESHOLD).toBe(0.2);
  });
});

describe("batteryAllowsSync / batteryRetryDelayMs", () => {
  it("is the logical inverse of shouldPauseSyncForBattery", () => {
    for (const s of [state({ level: 0.1 }), state({ level: 0.5 }), state({ charging: true, level: 0.05 })]) {
      expect(batteryAllowsSync(s)).toBe(!shouldPauseSyncForBattery(s));
    }
  });

  it("returns a recheck delay only while paused", () => {
    expect(batteryRetryDelayMs(state({ level: 0.1 }))).toBe(5 * 60 * 1000);
    expect(batteryRetryDelayMs(state({ level: 0.5 }))).toBe(0);
  });
});
