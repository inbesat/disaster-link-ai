// ---------------------------------------------------------------------
// lib/sms/whatsapp-commands.test.ts — Phase 13 · Step 6 · WhatsApp bot
// logic tests.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import {
  mapsLink,
  normalizeWhatsappCommand,
  whatsappHelpReply,
  whatsappMenuReply,
  whatsappShelterReply,
} from "./whatsapp-commands";

describe("normalizeWhatsappCommand", () => {
  it("recognises SHELTER and HELP case-insensitively", () => {
    expect(normalizeWhatsappCommand("Shelter")).toBe("SHELTER");
    expect(normalizeWhatsappCommand("shelter")).toBe("SHELTER");
    expect(normalizeWhatsappCommand("Help")).toBe("HELP");
    expect(normalizeWhatsappCommand("  HELP  ")).toBe("HELP");
  });

  it("strips punctuation and rejects unknown messages", () => {
    expect(normalizeWhatsappCommand("shelter!")).toBe("SHELTER");
    expect(normalizeWhatsappCommand("where is the shelter")).toBeNull();
    expect(normalizeWhatsappCommand("")).toBeNull();
  });
});

describe("mapsLink", () => {
  it("builds a Google Maps deep link from lat/lng", () => {
    expect(mapsLink(25.609, 85.164)).toBe(
      "https://maps.google.com/?q=25.609,85.164",
    );
  });
});

describe("whatsappShelterReply", () => {
  const reply = whatsappShelterReply();

  it("bolds the heading with WhatsApp asterisks", () => {
    expect(reply).toContain("*Nearest Shelter*");
  });

  it("carries the shelter name, distance and phone", () => {
    expect(reply).toContain("🏥 Patna Central Community Hall");
    expect(reply).toContain("3.1 km away");
    expect(reply).toContain("📞 0612-2210107");
  });
});

describe("whatsappHelpReply", () => {
  const reply = whatsappHelpReply();

  it("includes a Google Maps link to the nearest shelter", () => {
    expect(reply).toContain("Open in Maps: https://maps.google.com/?q=25.609,85.164");
    expect(reply).toContain("Patna Central Community Hall");
  });

  it("mentions the SHELTER and HELP commands", () => {
    expect(reply).toContain("*SHELTER*");
    expect(reply).toContain("*HELP*");
  });
});

describe("whatsappMenuReply", () => {
  it("lists the available commands", () => {
    const reply = whatsappMenuReply();
    expect(reply).toContain("*SHELTER*");
    expect(reply).toContain("*HELP*");
  });
});
