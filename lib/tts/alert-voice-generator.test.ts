// Phase 26 · TTS pipeline tests: template assembly, beep synthesis, and
// the language/voice registry.
import { describe, it, expect } from "vitest";
import { buildAlertScript, fillTemplateVars } from "./templates";
import { generateBeepWav } from "./beep";
import { TTS_LANGUAGE_VOICES, TTS_LANGUAGES } from "./languages";
import type { AlertVoiceRequest } from "./types";

const baseRequest = (overrides: Partial<AlertVoiceRequest> = {}): AlertVoiceRequest => ({
  message: undefined,
  language: "hi",
  severity: "critical",
  district: "Patna",
  disasterType: "flood",
  ...overrides,
});

describe("buildAlertScript (Phase 26)", () => {
  it("prepends the emergency intro", () => {
    const script = buildAlertScript(baseRequest());
    expect(script).toContain("emergency alert from SafeSphere");
    expect(script).toContain("District Disaster Management Authority");
  });

  it("uses the disaster template when no message is supplied", () => {
    const script = buildAlertScript(
      baseRequest({
        disasterType: "flood",
        templateVars: {
          river_name: "Ganga",
          affected_areas: "low-lying riverside wards",
          shelter_names: "Central Community Hall",
        },
      }),
    );
    expect(script).toContain("Heavy rainfall has caused the Ganga");
    expect(script).toContain("in Patna");
    expect(script).toContain("Central Community Hall");
  });

  it("uses the caller-supplied message verbatim", () => {
    const script = buildAlertScript(
      baseRequest({ message: "Evacuate North Ward immediately." }),
    );
    expect(script).toContain("Evacuate North Ward immediately.");
    expect(script).not.toContain("Heavy rainfall has caused");
  });

  it("appends disaster-specific action instructions", () => {
    const cyclone = buildAlertScript(baseRequest({ disasterType: "cyclone" }));
    expect(cyclone).toContain("Move to the nearest cyclone shelter immediately");
    expect(cyclone).toContain("Stay away from coastal areas");

    const earthquake = buildAlertScript(baseRequest({ disasterType: "earthquake" }));
    expect(earthquake).toContain("A seismic event of magnitude");
    expect(earthquake).toContain("Do not use elevators");

    const heatwave = buildAlertScript(baseRequest({ disasterType: "heatwave" }));
    expect(heatwave).toContain("Extreme heatwave conditions are forecast");
    expect(heatwave).toContain("Check on elderly neighbors");
  });

  it("orders the segments: intro → severity → core → actions", () => {
    const script = buildAlertScript(baseRequest());
    const introAt = script.indexOf("SafeSphere");
    const severityAt = script.indexOf("critical emergency");
    const coreAt = script.indexOf("Heavy rainfall has caused");
    const actionsAt = script.indexOf("Move to higher ground");
    expect(introAt).toBeLessThan(severityAt);
    expect(severityAt).toBeLessThan(coreAt);
    expect(coreAt).toBeLessThan(actionsAt);
  });

  it("handles missing template vars with defaults", () => {
    const script = buildAlertScript(baseRequest({ disasterType: "heatwave" }));
    expect(script).toContain("45 degrees Celsius");
  });
});

describe("fillTemplateVars (Phase 26)", () => {
  it("replaces known variables", () => {
    expect(fillTemplateVars("River {river_name} at {temp}°C", { river_name: "Ganga", temp: "40" }))
      .toBe("River Ganga at 40°C");
  });

  it("leaves unknown placeholders intact", () => {
    expect(fillTemplateVars("{unknown_var} stays", {})).toBe("{unknown_var} stays");
  });
});

describe("generateBeepWav (Phase 26)", () => {
  it("produces a valid 44-byte RIFF/WAVE header + PCM data", () => {
    const buffer = generateBeepWav();
    expect(buffer.toString("ascii", 0, 4)).toBe("RIFF");
    expect(buffer.toString("ascii", 8, 12)).toBe("WAVE");
    expect(buffer.toString("ascii", 36, 40)).toBe("data");
  });

  it("is mono 16-bit at the configured sample rate (default 1000 Hz/0.5 s)", () => {
    const buffer = generateBeepWav();
    expect(buffer.readUInt16LE(22)).toBe(1); // channels
    expect(buffer.readUInt16LE(34)).toBe(16); // bits per sample
    expect(buffer.readUInt32LE(40)).toBeGreaterThan(0); // data length
    // Default duration 0.5s @ 22050Hz = 11025 samples * 2 bytes.
    expect(buffer.readUInt32LE(40)).toBe(11025 * 2);
  });

  it("respects a custom duration", () => {
    const buffer = generateBeepWav(1000, 1);
    expect(buffer.readUInt32LE(40)).toBe(22050 * 2);
  });

  it("writes in-range PCM samples (no clipping)", () => {
    const buffer = generateBeepWav();
    let min = 0;
    let max = 0;
    for (let i = 44; i < buffer.length; i += 2) {
      const sample = buffer.readInt16LE(i);
      min = Math.min(min, sample);
      max = Math.max(max, sample);
    }
    expect(min).toBeGreaterThan(-32768);
    expect(max).toBeLessThan(32768);
    expect(max).toBeGreaterThan(0);
    expect(min).toBeLessThan(0);
  });
});

describe("TTS_LANGUAGE_VOICES (Phase 26)", () => {
  it("covers every supported language", () => {
    expect(TTS_LANGUAGES).toContain("hi");
    expect(TTS_LANGUAGES).toContain("bn");
    expect(TTS_LANGUAGES).toContain("ta");
  });

  it("maps every language to voices on all three providers", () => {
    for (const lang of TTS_LANGUAGES) {
      expect(TTS_LANGUAGE_VOICES[lang].elevenlabs.length).toBeGreaterThan(0);
      expect(TTS_LANGUAGE_VOICES[lang].azure.length).toBeGreaterThan(0);
      expect(TTS_LANGUAGE_VOICES[lang].google.length).toBeGreaterThan(0);
    }
  });

  it("uses the Indian Azure neural voices from the spec", () => {
    expect(TTS_LANGUAGE_VOICES.hi.azure).toBe("hi-IN-MadhurNeural");
    expect(TTS_LANGUAGE_VOICES.en.azure).toBe("en-IN-NeerjaNeural");
    expect(TTS_LANGUAGE_VOICES.bn.azure).toBe("bn-IN-TanishaaNeural");
    expect(TTS_LANGUAGE_VOICES.ta.azure).toBe("ta-IN-ValluvarNeural");
  });
});
