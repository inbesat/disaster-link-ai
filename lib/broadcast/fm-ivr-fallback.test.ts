// Phase 5 · IVR fallback tests — language detection, TwiML structure, URL
// safety, and callStationControlRoom with a mocked Twilio voice client.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { placeVoiceCallMock } = vi.hoisted(() => ({
  placeVoiceCallMock: vi.fn(),
}));

vi.mock("@/lib/alerts/twilio-client", () => ({
  placeVoiceCall: placeVoiceCallMock,
}));

import {
  buildIvrTwiml,
  callStationControlRoom,
  detectIvrLanguage,
  isSafePlayUrl,
} from "./fm-ivr-fallback";

beforeEach(() => {
  placeVoiceCallMock.mockReset();
  process.env.NEXT_PUBLIC_SITE_URL = "https://safesphere.app";
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SITE_URL;
});

describe("detectIvrLanguage (Phase 5)", () => {
  it("maps Indian states to their regional language", () => {
    expect(detectIvrLanguage("Bihar")).toBe("hi");
    expect(detectIvrLanguage("Uttar Pradesh")).toBe("hi");
    expect(detectIvrLanguage("West Bengal")).toBe("bn");
    expect(detectIvrLanguage("Tamil Nadu")).toBe("ta");
    expect(detectIvrLanguage("Maharashtra")).toBe("mr");
    expect(detectIvrLanguage("Kerala")).toBe("ml");
    expect(detectIvrLanguage("Telangana")).toBe("te");
  });

  it("defaults to English for unknown or missing states", () => {
    expect(detectIvrLanguage(null)).toBe("en");
    expect(detectIvrLanguage("")).toBe("en");
    expect(detectIvrLanguage("Somewhere Else")).toBe("en");
  });

  it("passes through a language code unchanged", () => {
    expect(detectIvrLanguage("hi")).toBe("hi");
    expect(detectIvrLanguage("bn")).toBe("bn");
  });
});

describe("buildIvrTwiml (Phase 5)", () => {
  it("matches the spec call flow: intro <Say> → <Play> → outro <Say>", () => {
    const twiml = buildIvrTwiml({
      audioUrl: "https://cdn.safesphere.ai/alerts/flood_patna_001.mp3",
      alertText: "Evacuate now.",
      language: "hi",
    });

    expect(twiml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(twiml).toContain("<Response>");
    expect(twiml).toContain(
      "<Play>https://cdn.safesphere.ai/alerts/flood_patna_001.mp3</Play>",
    );
    expect(twiml).toContain('voice="Polly.Aditi"');
    expect(twiml).toContain('language="hi-IN"');

    const introAt = twiml.indexOf("Namaskar");
    const playAt = twiml.indexOf("<Play>");
    const outroAt = twiml.indexOf("Kripya");
    expect(introAt).toBeGreaterThan(-1);
    expect(playAt).toBeGreaterThan(introAt);
    expect(outroAt).toBeGreaterThan(playAt);
  });

  it("uses the regional voice config for the station's language", () => {
    const twiml = buildIvrTwiml({
      audioUrl: null,
      alertText: "Alert.",
      language: "bn",
    });
    expect(twiml).toContain('language="bn-IN"');
    expect(twiml).toContain("Nomoshkar");
  });

  it("speaks the alert text when no MP3 is available", () => {
    const twiml = buildIvrTwiml({
      audioUrl: null,
      alertText: "Move to higher ground immediately.",
      language: "en",
    });
    expect(twiml).not.toContain("<Play>");
    expect(twiml).toContain("Move to higher ground immediately.");
  });

  it("rejects unsafe play URLs instead of embedding them", () => {
    const twiml = buildIvrTwiml({
      audioUrl: "javascript:alert(1)",
      alertText: "Safe spoken fallback.",
      language: "en",
    });
    expect(twiml).not.toContain("<Play>javascript:");
    expect(twiml).toContain("Safe spoken fallback.");
  });

  it("escapes XML metacharacters in the alert text", () => {
    const twiml = buildIvrTwiml({
      audioUrl: null,
      alertText: "Flood <warning> & stay safe.",
      language: "en",
    });
    expect(twiml).toContain("Flood &lt;warning&gt; &amp; stay safe.");
    expect(twiml).not.toContain("<warning>");
  });
});

describe("isSafePlayUrl (Phase 5)", () => {
  it("accepts http(s) and rejects everything else", () => {
    expect(isSafePlayUrl("https://cdn.safesphere.ai/a.mp3")).toBe(true);
    expect(isSafePlayUrl("http://cdn.safesphere.ai/a.mp3")).toBe(true);
    expect(isSafePlayUrl("javascript:alert(1)")).toBe(false);
    expect(isSafePlayUrl("ftp://cdn.safesphere.ai/a.mp3")).toBe(false);
    expect(isSafePlayUrl(null)).toBe(false);
    expect(isSafePlayUrl("")).toBe(false);
  });
});

describe("callStationControlRoom (Phase 5)", () => {
  it("places the call and returns the CallSid", async () => {
    placeVoiceCallMock.mockResolvedValue({ ok: true, callSid: "CA123" });

    const result = await callStationControlRoom(
      "+919876543210",
      "https://cdn.safesphere.ai/alerts/flood_patna_001.mp3",
      "Alert text.",
      { state: "Bihar" },
    );

    expect(result.ok).toBe(true);
    expect(result.callSid).toBe("CA123");
    expect(result.responseCode).toBe(201);
    expect(placeVoiceCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "+919876543210",
        twiml: expect.stringContaining('language="hi-IN"'),
        statusCallbackUrl: expect.stringContaining("/api/webhooks/twilio/call-status"),
      }),
    );
  });

  it("uses the station's regional language in the TwiML", async () => {
    placeVoiceCallMock.mockResolvedValue({ ok: true, callSid: "CA124" });

    await callStationControlRoom("+919800000000", null, "Alert.", {
      state: "West Bengal",
    });

    const twiml = (placeVoiceCallMock.mock.calls[0][0] as { twiml: string }).twiml;
    expect(twiml).toContain('language="bn-IN"');
    expect(twiml).toContain("Nomoshkar");
  });

  it("surfaces Twilio failures as a failed result", async () => {
    placeVoiceCallMock.mockResolvedValue({ ok: false, error: "Account suspended" });

    const result = await callStationControlRoom("+919876543210", null, "Alert.", {});

    expect(result.ok).toBe(false);
    expect(result.callSid).toBeNull();
    expect(result.error).toContain("Account suspended");
  });
});
