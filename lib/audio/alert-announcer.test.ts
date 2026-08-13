// ---------------------------------------------------------------------
// lib/audio/alert-announcer.test.ts — Phase 11 native TTS fallback chain
// ---------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import {
  alertClipFor,
  announceAlert,
  playAlertClip,
  speakAlertChannel,
  vibrateAlert,
} from "./alert-announcer";

describe("alertClipFor", () => {
  it("maps flood/hi to the Hindi clip", () => {
    expect(alertClipFor("flood", "hi-IN")).toBe("/demo-audio/flood_hi.wav");
  });

  it("maps types to their English clip by default", () => {
    expect(alertClipFor("earthquake", "en")).toBe("/demo-audio/earthquake_en.wav");
    expect(alertClipFor("cyclone", undefined)).toBe("/demo-audio/cyclone_en.wav");
  });

  it("returns null for unknown alert types", () => {
    expect(alertClipFor("general", "en")).toBeNull();
    expect(alertClipFor(undefined, "en")).toBeNull();
  });
});

describe("speakAlertChannel", () => {
  it("uses the injected speak fn", () => {
    const speak = vi.fn(() => true);
    expect(speakAlertChannel("Move now", "hi", speak)).toBe(true);
    expect(speak).toHaveBeenCalledWith("Move now", "hi");
  });

  it("returns false when no injectable speak is provided (node env)", () => {
    expect(speakAlertChannel("Move now")).toBe(false);
  });
});

describe("playAlertClip", () => {
  it("delegates to the injected player", async () => {
    const play = vi.fn(async () => true);
    expect(await playAlertClip("/x.wav", play)).toBe(true);
    expect(play).toHaveBeenCalledWith("/x.wav");
  });

  it("returns false when Audio is unavailable", async () => {
    expect(await playAlertClip("/x.wav")).toBe(false);
  });
});

describe("vibrateAlert", () => {
  it("delegates to the injected vibrate fn", () => {
    const vibrate = vi.fn(() => true);
    expect(vibrateAlert([100], vibrate)).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([100]);
  });

  it("returns false without navigator.vibrate (node env)", () => {
    expect(vibrateAlert([100])).toBe(false);
  });
});

describe("announceAlert", () => {
  it("prefers TTS over the clip", async () => {
    const channel = await announceAlert({
      text: "Evacuate now",
      alertType: "flood",
      speak: () => true,
      playClip: async () => true,
      vibrate: () => true,
    });
    expect(channel).toBe("tts");
  });

  it("falls back to the pre-recorded clip when TTS is unavailable", async () => {
    const channel = await announceAlert({
      text: "Evacuate now",
      alertType: "flood",
      speak: () => false,
      playClip: async () => true,
      vibrate: () => true,
    });
    expect(channel).toBe("clip");
  });

  it("falls back to vibration when both TTS and clip fail", async () => {
    const channel = await announceAlert({
      text: "Evacuate now",
      alertType: "flood",
      speak: () => false,
      playClip: async () => false,
      vibrate: () => true,
    });
    expect(channel).toBe("vibration");
  });

  it("reports none when every channel is unavailable", async () => {
    const channel = await announceAlert({
      text: "Evacuate now",
      alertType: "flood",
      speak: () => false,
      playClip: async () => false,
      vibrate: () => false,
    });
    expect(channel).toBe("none");
  });
});
