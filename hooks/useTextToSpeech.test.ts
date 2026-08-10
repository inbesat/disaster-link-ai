// ---------------------------------------------------------------------
// hooks/useTextToSpeech.test.ts
// The speechSynthesis API only exists in real browsers, so the module's
// contract in node (and during SSR) is: safe to import, safe to call,
// reports unsupported. The UI behaviour (speak/stop flip) is exercised
// in the live browser checks instead.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { speakAlert, stopSpeaking, supportsSpeech } from "./useTextToSpeech";

describe("useTextToSpeech (unsupported environment)", () => {
  it("reports no speech support when speechSynthesis is absent", () => {
    expect(supportsSpeech()).toBe(false);
  });

  it("speakAlert returns false without throwing", () => {
    expect(speakAlert("Evacuate now")).toBe(false);
  });

  it("stopSpeaking is a safe no-op", () => {
    expect(() => stopSpeaking()).not.toThrow();
  });
});
