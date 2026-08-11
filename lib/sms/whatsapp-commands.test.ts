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
  whatsappRouteReply,
  whatsappShelterReply,
  whatsappSheltersTop3Reply,
  whatsappSosReply,
  whatsappStatusReply,
  WHATSAPP_SAFE_REPLY,
} from "./whatsapp-commands";

describe("normalizeWhatsappCommand", () => {
  it("recognises all five commands case-insensitively", () => {
    expect(normalizeWhatsappCommand("Status")).toBe("STATUS");
    expect(normalizeWhatsappCommand("Shelter")).toBe("SHELTER");
    expect(normalizeWhatsappCommand("shelter")).toBe("SHELTER");
    expect(normalizeWhatsappCommand("Route")).toBe("ROUTE");
    expect(normalizeWhatsappCommand("safe")).toBe("SAFE");
    expect(normalizeWhatsappCommand("Help")).toBe("HELP");
    expect(normalizeWhatsappCommand("  HELP  ")).toBe("HELP");
  });

  it("treats SOS as HELP and strips punctuation", () => {
    expect(normalizeWhatsappCommand("SOS")).toBe("HELP");
    expect(normalizeWhatsappCommand("shelter!")).toBe("SHELTER");
    expect(normalizeWhatsappCommand("status.")).toBe("STATUS");
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
    expect(reply).toContain("*STATUS*");
    expect(reply).toContain("*SHELTER*");
    expect(reply).toContain("*ROUTE*");
    expect(reply).toContain("*SAFE*");
    expect(reply).toContain("*HELP*");
  });
});

describe("whatsappStatusReply", () => {
  const reply = whatsappStatusReply();

  it("reports the current flood risk for the district", () => {
    expect(reply).toContain("*Bharat Shakti Status*");
    expect(reply).toContain("Patna is under");
    expect(reply).toContain("Nearest shelter: Patna Central Community Hall");
  });
});

describe("whatsappSheltersTop3Reply", () => {
  const reply = whatsappSheltersTop3Reply();

  it("lists exactly three shelters with distances", () => {
    expect(reply).toContain("*Nearest Shelters*");
    const lines = reply.split("\n").filter((l) => /^[1-3]\. 🏥/.test(l));
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatch(/Patna Central Community Hall — \d+\.\d km/);
  });

  it("never recommends a full shelter", () => {
    expect(reply).not.toContain("Danapur Relief Camp");
  });
});

describe("whatsappRouteReply", () => {
  it("returns a Google Maps URL for evacuation", () => {
    const reply = whatsappRouteReply();
    expect(reply).toContain("*Evacuation Route*");
    expect(reply).toContain("Open in Maps: https://maps.google.com/?q=25.609,85.164");
  });
});

describe("whatsappSafeReply", () => {
  it("confirms the safe status with family notification", () => {
    expect(WHATSAPP_SAFE_REPLY).toBe("Status marked safe. Family notified.");
  });
});

describe("whatsappSosReply", () => {
  it("confirms the SOS reached the control room", () => {
    const reply = whatsappSosReply();
    expect(reply).toContain("*SOS Received*");
    expect(reply).toContain("District Control Room");
  });
});
