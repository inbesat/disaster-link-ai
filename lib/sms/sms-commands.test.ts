// ---------------------------------------------------------------------
// lib/sms/sms-commands.test.ts — Phase 13 · Step 4 · SMS webhook tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  buildTwiML,
  escapeXml,
  helpReplyMessage,
  normalizePhoneForMatch,
  normalizeSmsCommand,
  parseSmsForm,
  statusReplyMessage,
} from "./sms-commands";

describe("parseSmsForm", () => {
  it("decodes Twilio's form-encoded fields (Body, From, To)", () => {
    const form = parseSmsForm(
      "Body=STATUS&From=%2B919876543210&To=%2B9199998888&MessageSid=SM123",
    );
    expect(form.Body).toBe("STATUS");
    expect(form.From).toBe("+919876543210");
    expect(form.To).toBe("+9199998888");
    expect(form.MessageSid).toBe("SM123");
  });

  it("decodes URL-encoded spaces and plus signs in the body", () => {
    expect(parseSmsForm("Body=help+me+now").Body).toBe("help me now");
    expect(parseSmsForm("Body=SAFE%21").Body).toBe("SAFE!");
  });

  it("tolerates an empty body — no fabricated fields (signature integrity)", () => {
    // Empty input must produce an empty form: fabricated keys would alter
    // the Twilio signature canonicalisation (params must match exactly).
    expect(parseSmsForm("")).toEqual({});
    expect(parseSmsForm("").Body).toBeUndefined();
  });
});

describe("normalizeSmsCommand", () => {
  it("recognises the three commands case-insensitively", () => {
    expect(normalizeSmsCommand("STATUS")).toBe("STATUS");
    expect(normalizeSmsCommand("status")).toBe("STATUS");
    expect(normalizeSmsCommand(" Safe ")).toBe("SAFE");
    expect(normalizeSmsCommand("help")).toBe("HELP");
  });

  it("strips common punctuation", () => {
    expect(normalizeSmsCommand("status!")).toBe("STATUS");
    expect(normalizeSmsCommand("SAFE.")).toBe("SAFE");
    expect(normalizeSmsCommand("  help  ")).toBe("HELP");
  });

  it("rejects anything that is not a command", () => {
    expect(normalizeSmsCommand("where is the shelter")).toBeNull();
    expect(normalizeSmsCommand("")).toBeNull();
    expect(normalizeSmsCommand("SAFE STATUS")).toBeNull();
  });
});

describe("normalizePhoneForMatch", () => {
  it("reduces E.164 and loose numbers to the last 10 digits", () => {
    expect(normalizePhoneForMatch("+919876543210")).toBe("9876543210");
    expect(normalizePhoneForMatch("919876543210")).toBe("9876543210");
    expect(normalizePhoneForMatch("09876543210")).toBe("9876543210");
    expect(normalizePhoneForMatch("987-654-3210")).toBe("9876543210");
  });
});

describe("escapeXml + buildTwiML", () => {
  it("escapes XML-sensitive characters in the message", () => {
    expect(escapeXml("A & B < C > D \"E\" 'F'")).toBe(
      "A &amp; B &lt; C &gt; D &quot;E&quot; &apos;F&apos;",
    );
  });

  it("wraps a message in a valid TwiML Response/Message document", () => {
    const xml = buildTwiML("Risk & shelter info");
    expect(xml).toContain("<Response><Message>");
    expect(xml).toContain("Risk &amp; shelter info");
    expect(xml).toContain("</Message></Response>");
  });
});

describe("reply messages", () => {
  it("STATUS reply carries district risk + nearest shelter from lite-status", () => {
    const reply = statusReplyMessage();
    expect(reply).toContain("SafeSphere: Patna is under");
    expect(reply).toContain("Nearest shelter: Patna Central Community Hall");
    expect(reply).toContain("Call 1070 for help");
  });

  it("HELP reply lists the available commands", () => {
    const reply = helpReplyMessage();
    expect(reply).toContain("STATUS");
    expect(reply).toContain("SAFE");
  });
});
