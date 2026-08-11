// ---------------------------------------------------------------------
// lib/alerts/countdown.test.ts — Phase 3 · Step 11 · critical overlay
// trigger timing. Locks formatCountdown (the "Flood expected in HH:MM:SS"
// readout) so the overlay's countdown is verified: zero-padding, the
// default 4-hour spec value, and clamping of negative/over-long input.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { formatCountdown } from "./countdown";

describe("formatCountdown", () => {
  it("renders the spec default of 4 hours as 04:00:00", () => {
    expect(formatCountdown(4 * 60 * 60)).toBe("04:00:00");
  });

  it("zero-pads hours, minutes and seconds", () => {
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(1)).toBe("00:00:01");
    expect(formatCountdown(61)).toBe("00:01:01");
    expect(formatCountdown(3600)).toBe("01:00:00");
  });

  it("overflows hours past 99 into 3 digits", () => {
    expect(formatCountdown(100 * 3600)).toBe("100:00:00");
  });

  it("clamps negatives and fractions to zero (never negative time)", () => {
    expect(formatCountdown(-5)).toBe("00:00:00");
    expect(formatCountdown(59.9)).toBe("00:00:59");
    expect(formatCountdown(0.1)).toBe("00:00:00");
  });

  it("matches the component's tick-down behavior at 1-second granularity", () => {
    // The overlay decrements by 1 per second from 14400; each step's
    // readout must remain a valid zero-padded clock.
    let seconds = 4 * 60 * 60;
    for (let i = 0; i < 120; i++) {
      seconds -= 1;
      expect(formatCountdown(seconds)).toMatch(/^\d{2,3}:\d{2}:\d{2}$/);
    }
    expect(formatCountdown(seconds)).toBe("03:58:00");
  });
});
