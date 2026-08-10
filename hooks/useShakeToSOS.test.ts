// ---------------------------------------------------------------------
// hooks/useShakeToSOS.test.ts
// The physics + counting semantics live in the pure helpers
// (accelerationMagnitude, createSpikeDetector) so they're testable
// without a browser; the hook itself is a thin event-listener wrapper
// exercised in the live browser checks instead.
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  accelerationMagnitude,
  createSpikeDetector,
} from "./useShakeToSOS";

describe("accelerationMagnitude", () => {
  it("returns ~gravity for a phone at rest (z-axis only)", () => {
    const mag = accelerationMagnitude({ x: 0, y: 0, z: 9.8 });
    expect(mag).toBeCloseTo(9.8, 5);
  });

  it("combines all three axes (including gravity)", () => {
    // x=3, y=4, z=0 → classic 3-4-5 triangle → 5
    expect(accelerationMagnitude({ x: 3, y: 4, z: 0 })).toBeCloseTo(5, 5);
  });

  it("degrades null axes to 0 instead of NaN", () => {
    expect(accelerationMagnitude({ x: null, y: null, z: null })).toBe(0);
    expect(accelerationMagnitude({ x: 10, y: null, z: null })).toBe(10);
    expect(Number.isNaN(accelerationMagnitude({ x: null, y: 1, z: null }))).toBe(false);
  });

  it("reads above the shake threshold for a violent shake vector", () => {
    // A hard shake swamps gravity: e.g. (18, 12, 8) → ~23 m/s².
    expect(accelerationMagnitude({ x: 18, y: 12, z: 8 })).toBeGreaterThan(22);
  });
});

describe("createSpikeDetector", () => {
  it("triggers once when the required spikes land inside the window", () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const detector = createSpikeDetector({ requiredSpikes: 3, windowMs: 2000 }, onTrigger);

    detector.fire(0);
    detector.fire(500);
    expect(onTrigger).not.toHaveBeenCalled();
    detector.fire(1900);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("does NOT trigger when the window slides past earlier spikes", () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const detector = createSpikeDetector({ requiredSpikes: 3, windowMs: 2000 }, onTrigger);

    detector.fire(0);
    detector.fire(1900);
    // Spike at 3900 is > 2000ms after the spike at 1900, and the one at
    // 0 has fallen out — only two spikes remain in the window.
    detector.fire(3900);
    expect(onTrigger).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("enters a cooldown after triggering — residual shakes don't re-fire", () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const detector = createSpikeDetector(
      { requiredSpikes: 3, windowMs: 2000, cooldownMs: 5000 },
      onTrigger,
    );

    detector.fire(0);
    detector.fire(100);
    detector.fire(200);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    // Three more spikes while still in cooldown.
    detector.fire(500);
    detector.fire(600);
    detector.fire(700);
    expect(onTrigger).toHaveBeenCalledTimes(1);

    // After the cooldown expires a fresh burst of 3 can trigger again.
    // (5100 is still inside the lockout → dropped; 5200–5400 is a new burst.)
    detector.fire(5100);
    detector.fire(5200);
    detector.fire(5300);
    detector.fire(5400);
    expect(onTrigger).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("reset() clears the spike log and any lockout", () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const detector = createSpikeDetector(
      { requiredSpikes: 3, windowMs: 2000, cooldownMs: 5000 },
      onTrigger,
    );

    detector.fire(0);
    detector.fire(100);
    detector.reset();
    detector.fire(200);
    detector.fire(300);
    expect(onTrigger).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("is a no-op before enough spikes accumulate", () => {
    vi.useFakeTimers();
    const onTrigger = vi.fn();
    const detector = createSpikeDetector({ requiredSpikes: 4, windowMs: 2000 }, onTrigger);
    detector.fire(0);
    detector.fire(100);
    detector.fire(200);
    expect(onTrigger).not.toHaveBeenCalled();
    detector.fire(300);
    expect(onTrigger).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
