import { describe, expect, it } from "vitest";
import {
  HAPTIC_PATTERN,
  TONE_OPTIONS,
  TONE_PATTERNS,
  isSilentTone,
  toneDuration,
  toneOscillatorType,
  type ToneId,
} from "./alert-tone";

// ---------------------------------------------------------------------
// lib/alert-tone.test.ts — critical alert tone audit (Step 6):
//   • all four tone options are selectable and have sounds/durations
//   • silent is the only non-audio tone (vibrate-only feedback)
//   • oscillator type + duration helpers line up for the card
// ---------------------------------------------------------------------

describe("tone options", () => {
  it("exposes the four requested critical tones", () => {
    expect(TONE_OPTIONS.map((o) => o.label)).toEqual([
      "Standard Siren",
      "Digital Chime",
      "Harsh Beep",
      "Silent (Vibrate Only)",
    ]);
  });

  it("every tone owns a pattern signature under 2 seconds", () => {
    for (const { id } of TONE_OPTIONS) {
      const duration = toneDuration(id);
      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(2);
    }
  });
});

describe("isSilentTone", () => {
  it("marks silent as silent", () => {
    expect(isSilentTone("silent")).toBe(true);
  });

  it("marks audible tones as non-silent", () => {
    expect(isSilentTone("standard_siren")).toBe(false);
    expect(isSilentTone("digital_chime")).toBe(false);
    expect(isSilentTone("harsh_beep")).toBe(false);
  });
});

describe("toneDuration", () => {
  it("is the end of the last step", () => {
    expect(toneDuration("digital_chime")).toBeCloseTo(0.36 + 0.4);
    expect(toneDuration("silent")).toBe(0);
  });
});

describe("toneOscillatorType", () => {
  it("uses square wave for the harsh beep, sine elsewhere", () => {
    expect(toneOscillatorType("harsh_beep")).toBe("square");
    expect(toneOscillatorType("standard_siren")).toBe("sine");
    expect(toneOscillatorType("digital_chime")).toBe("sine");
  });
});

describe("haptic pattern", () => {
  it("is a rhythm the short mobile buzzes follow", () => {
    expect(HAPTIC_PATTERN.length).toBe(5);
    expect(HAPTIC_PATTERN.every((ms) => ms > 0)).toBe(true);
  });
});

describe("pattern integrity", () => {
  it("every non-silent tone has at least one step with a valid frequency", () => {
    const ids: ToneId[] = ["standard_siren", "digital_chime", "harsh_beep", "silent"];
    for (const id of ids) {
      const pattern = TONE_PATTERNS[id];
      if (isSilentTone(id)) {
        expect(pattern.length).toBe(0);
      } else {
        expect(pattern.length).toBeGreaterThan(0);
        for (const step of pattern) {
          expect(step.freq).toBeGreaterThan(0);
          expect(step.gain).toBeGreaterThan(0);
          expect(step.gain).toBeLessThanOrEqual(0.6);
        }
      }
    }
  });
});