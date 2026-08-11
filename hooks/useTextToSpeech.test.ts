// ---------------------------------------------------------------------
// hooks/useTextToSpeech.test.ts
// The speechSynthesis API only exists in real browsers, so the module's
// contract in node (and during SSR) is: safe to import, safe to call,
// reports unsupported. The UI behaviour (speak/stop flip) is exercised
// in the live browser checks instead.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  speakAlert,
  stopSpeaking,
  supportsSpeech,
  voiceLangForLocale,
} from "./useTextToSpeech";

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

describe("voiceLangForLocale (Phase 13 · Step 7)", () => {
  it("maps the major Indian languages to BCP-47 tags", () => {
    expect(voiceLangForLocale("hi")).toBe("hi-IN");
    expect(voiceLangForLocale("bn")).toBe("bn-IN");
    expect(voiceLangForLocale("ta")).toBe("ta-IN");
    expect(voiceLangForLocale("te")).toBe("te-IN");
    expect(voiceLangForLocale("mr")).toBe("mr-IN");
    expect(voiceLangForLocale("gu")).toBe("gu-IN");
    expect(voiceLangForLocale("kn")).toBe("kn-IN");
    expect(voiceLangForLocale("ml")).toBe("ml-IN");
  });

  it("falls back to undefined (English narration) for locales without reliable voices", () => {
    expect(voiceLangForLocale("en")).toBeUndefined();
    expect(voiceLangForLocale("sat")).toBeUndefined();
    expect(voiceLangForLocale("sa")).toBeUndefined();
  });
});
