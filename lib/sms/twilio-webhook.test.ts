// ---------------------------------------------------------------------
// lib/sms/twilio-webhook.test.ts — Phase 13 · Steps 5 · shared webhook
// helper tests (IVR TwiML structure + signature-gate behaviour).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import {
  VOICE_ALERT_MESSAGE,
  buildVoiceAlertTwiml,
  verifyTwilioSignature,
} from "./twilio-webhook";
import { parseSmsForm } from "./sms-commands";

function fakeRequest(url: string, headers: Record<string, string> = {}) {
  const parsed = new URL(url);
  return {
    url,
    nextUrl: { pathname: parsed.pathname, search: parsed.search },
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as Parameters<typeof verifyTwilioSignature>[0];
}

/**
 * Compute the signature Twilio would send for a webhook: HMAC-SHA1 over
 * the full public URL (query string included) + sorted POST params.
 */
function twilioSignature(token: string, url: string, params: Record<string, string> = {}) {
  const data =
    url +
    Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join("");
  return createHmac("sha1", token).update(data).digest("base64");
}

describe("buildVoiceAlertTwiml", () => {
  const xml = buildVoiceAlertTwiml();

  it("starts with the XML declaration and a Response verb", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<Response>");
    expect(xml).toContain("</Response>");
  });

  it("speaks the exact emergency message", () => {
    expect(xml).toContain(VOICE_ALERT_MESSAGE);
    expect(xml).toContain("Please evacuate immediately.");
  });

  it("uses the Indian-English voice and language attributes", () => {
    expect(xml).toContain('voice="Polly.Aditi"');
    expect(xml).toContain('language="en-IN"');
  });

  it("pauses 2 seconds and repeats the message once", () => {
    const says = xml.match(/<Say/g) ?? [];
    expect(says).toHaveLength(2);
    expect(xml).toContain('<Pause length="2"/>');
    // Both Say blocks carry identical content (the repeat).
    const first = xml.indexOf("<Say");
    const second = xml.indexOf("<Say", first + 1);
    expect(xml.slice(first, xml.indexOf("</Say>", first) + 6)).toBe(
      xml.slice(second, xml.indexOf("</Say>", second) + 6),
    );
  });

  it("escapes XML-sensitive characters in a custom message", () => {
    const custom = buildVoiceAlertTwiml("Risk < high > & rising");
    expect(custom).toContain("Risk &lt; high &gt; &amp; rising");
  });
});

describe("verifyTwilioSignature", () => {
  it("passes through when no auth token is configured (dev)", () => {
    const prev = process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_AUTH_TOKEN;
    try {
      const check = verifyTwilioSignature(
        fakeRequest("http://localhost:3000/api/webhooks/voice"),
        parseSmsForm(""),
      );
      expect(check).toEqual({ ok: true, reason: "no-token-configured" });
    } finally {
      if (prev !== undefined) process.env.TWILIO_AUTH_TOKEN = prev;
    }
  });

  it("rejects requests without a signature header when a token is set", () => {
    const prev = process.env.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    try {
      const check = verifyTwilioSignature(
        fakeRequest("http://localhost:3000/api/webhooks/voice"),
        parseSmsForm("Body=STATUS"),
      );
      expect(check).toEqual({ ok: false, reason: "missing-signature" });
    } finally {
      if (prev !== undefined) process.env.TWILIO_AUTH_TOKEN = prev;
      else delete process.env.TWILIO_AUTH_TOKEN;
    }
  });

  it("rejects a forged signature", () => {
    const prev = process.env.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    try {
      const check = verifyTwilioSignature(
        fakeRequest("http://localhost:3000/api/webhooks/voice", {
          "x-twilio-signature": "bm90LXRoZS1yZWFsLXNpZ25hdHVyZQ==",
        }),
        parseSmsForm("Body=STATUS"),
      );
      expect(check.ok).toBe(false);
    } finally {
      if (prev !== undefined) process.env.TWILIO_AUTH_TOKEN = prev;
      else delete process.env.TWILIO_AUTH_TOKEN;
    }
  });

  it("accepts a voice GET signed against the canonical site URL", () => {
    const prevToken = process.env.TWILIO_AUTH_TOKEN;
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    process.env.NEXT_PUBLIC_SITE_URL = "https://drip.example.com";
    try {
      // Request arrives via an internal proxy URL; Twilio signed the
      // public origin. No query string here.
      const signed = twilioSignature(
        "test-token",
        "https://drip.example.com/api/webhooks/voice",
      );
      const check = verifyTwilioSignature(
        fakeRequest("http://10.0.0.5/api/webhooks/voice", {
          "x-twilio-signature": signed,
        }),
        parseSmsForm(""),
      );
      expect(check).toEqual({ ok: true, reason: "valid" });
    } finally {
      if (prevToken !== undefined) process.env.TWILIO_AUTH_TOKEN = prevToken;
      else delete process.env.TWILIO_AUTH_TOKEN;
      if (prevSite !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prevSite;
      else delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it("keeps the query string in the canonical URL (voice GET callbacks)", () => {
    const prevToken = process.env.TWILIO_AUTH_TOKEN;
    const prevSite = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.TWILIO_AUTH_TOKEN = "test-token";
    process.env.NEXT_PUBLIC_SITE_URL = "https://drip.example.com";
    try {
      // A real voice webhook GET carries call metadata in the query
      // string, and Twilio's signature covers it as part of the URL.
      const query = "?CallSid=CA123&From=%2B919876543210&To=%2B919999999999";
      const signed = twilioSignature(
        "test-token",
        `https://drip.example.com/api/webhooks/voice${query}`,
      );
      const check = verifyTwilioSignature(
        fakeRequest(`http://10.0.0.5/api/webhooks/voice${query}`, {
          "x-twilio-signature": signed,
        }),
        parseSmsForm(""),
      );
      expect(check).toEqual({ ok: true, reason: "valid" });
    } finally {
      if (prevToken !== undefined) process.env.TWILIO_AUTH_TOKEN = prevToken;
      else delete process.env.TWILIO_AUTH_TOKEN;
      if (prevSite !== undefined) process.env.NEXT_PUBLIC_SITE_URL = prevSite;
      else delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });
});
