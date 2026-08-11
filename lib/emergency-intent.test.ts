import { describe, expect, it } from "vitest";
import { detectEmergency, EMERGENCY_ENGLISH, EMERGENCY_HINDI } from "./emergency-intent";

describe("detectEmergency", () => {
  it("detects every English keyword as a whole word", () => {
    for (const keyword of EMERGENCY_ENGLISH) {
      expect(detectEmergency(`please ${keyword} me now`), keyword).toBe(true);
    }
  });

  it("is case-insensitive", () => {
    expect(detectEmergency("HELP")).toBe(true);
    expect(detectEmergency("I'm Trapped on the roof")).toBe(true);
  });

  it("detects keywords inside a sentence", () => {
    expect(detectEmergency("The water is rising fast, we need rescue")).toBe(true);
    expect(detectEmergency("my mother needs medical help urgently")).toBe(true);
  });

  it("detects the Hindi equivalents", () => {
    for (const keyword of EMERGENCY_HINDI) {
      expect(detectEmergency(`मदद करो ${keyword}`), keyword).toBe(true);
    }
  });

  it("does not match partial words", () => {
    expect(detectEmergency("this is helpful advice")).toBe(false);
    expect(detectEmergency("the medicine cabinet is empty")).toBe(false);
  });

  it("returns false for routine questions", () => {
    expect(detectEmergency("where is the nearest shelter?")).toBe(false);
    expect(detectEmergency("how do I register my family?")).toBe(false);
    expect(detectEmergency("")).toBe(false);
  });
});
