// Phase 3 · CAP v1.2 — builder, validator, and template tests.
import { describe, it, expect } from "vitest";
import { buildCapAlert, escapeXml } from "./cap-builder";
import { validateCapAlert, validateCapXml } from "./cap-validator";
import {
  disasterCapPreset,
  resolveCapPreset,
  districtHeadline,
} from "./cap-templates";
import type { CapAlertInput } from "./types";

const SENT = "2026-08-12T06:00:00.000Z";
const EFFECTIVE = "2026-08-12T06:05:00.000Z";
const EXPIRES = "2026-08-13T06:05:00.000Z";

function validInput(overrides: Partial<CapAlertInput> = {}): CapAlertInput {
  return {
    identifier: "dl-abc12345-xyz",
    sender: "disasterlink.ai@ddma.gov.in",
    sent: SENT,
    status: "Actual",
    msgType: "Alert",
    scope: "Public",
    infos: [
      {
        language: "hi-IN",
        category: "Met",
        event: "Flood",
        urgency: "Immediate",
        severity: "Severe",
        certainty: "Observed",
        effective: EFFECTIVE,
        expires: EXPIRES,
        senderName: "District Disaster Management Authority",
        headline: "Severe Flood Warning: Patna",
        description: "The river has crossed the danger mark in Patna.",
        instruction: "Move to higher ground immediately.",
        areas: [{ areaDesc: "Patna riverside wards", circle: [85.14, 25.59, 50] }],
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------
// buildCapAlert
// ---------------------------------------------------------------------
describe("buildCapAlert (Phase 3 builder)", () => {
  it("emits the XML declaration + CAP DOCTYPE + namespace", () => {
    const xml = buildCapAlert(validInput());
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<!DOCTYPE alert PUBLIC "-//OASIS//DTD CAP 1.2//EN"');
    expect(xml).toContain('<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">');
  });

  it("writes every required alert-level element", () => {
    const xml = buildCapAlert(validInput());
    for (const el of ["identifier", "sender", "sent", "status", "msgType", "scope"]) {
      expect(xml).toContain(`<${el}>`);
    }
  });

  it("writes the full info block with geometry + resource", () => {
    const input = validInput();
    input.infos[0].resources = [
      { resourceDesc: "Emergency voice broadcast (MP3)", mimeType: "audio/mpeg", uri: "https://x/y.mp3" },
    ];
    const xml = buildCapAlert(input);
    for (const el of [
      "language",
      "category",
      "event",
      "urgency",
      "severity",
      "certainty",
      "effective",
      "expires",
      "senderName",
      "headline",
      "description",
      "instruction",
      "area",
      "areaDesc",
      "circle",
      "resource",
      "resourceDesc",
      "mimeType",
      "uri",
    ]) {
      expect(xml).toContain(`<${el}>`);
    }
  });

  it("renders closed polygons with lon,lat pairs", () => {
    const input = validInput();
    input.infos[0].areas = [
      {
        areaDesc: "Test zone",
        polygon: [
          [85.1, 25.5],
          [85.2, 25.5],
          [85.2, 25.6],
        ],
      },
    ];
    const xml = buildCapAlert(input);
    expect(xml).toContain("85.1,25.5 85.2,25.5 85.2,25.6 85.1,25.5");
  });

  it("escapes XML-sensitive characters in free text", () => {
    const input = validInput();
    input.infos[0].description = "Danger < 100% & avoid \"flooded\" roads";
    const xml = buildCapAlert(input);
    expect(xml).toContain("Danger &lt; 100% &amp; avoid &quot;flooded&quot; roads");
  });

  it("supports multiple info blocks (multilingual)", () => {
    const input = validInput();
    input.infos.push({
      ...input.infos[0],
      language: "en-IN",
    });
    const xml = buildCapAlert(input);
    expect((xml.match(/<info>/g) ?? []).length).toBe(2);
  });

  it("requires references when msgType is Update or Cancel", () => {
    expect(() => buildCapAlert(validInput({ msgType: "Cancel" }))).toThrow(
      /requires a <references>/,
    );
    const xml = buildCapAlert(
      validInput({ msgType: "Cancel", references: "dl-prev-123" }),
    );
    expect(xml).toContain("<references>dl-prev-123</references>");
  });

  it("throws when required alert-level fields are missing", () => {
    expect(() => buildCapAlert(validInput({ identifier: "" }))).toThrow(/identifier/);
    expect(() => buildCapAlert(validInput({ sender: "" }))).toThrow(/sender/);
    expect(() => buildCapAlert(validInput({ sent: "" }))).toThrow(/sent/);
    expect(() => buildCapAlert(validInput({ infos: [] }))).toThrow(/info/);
  });
});

describe("escapeXml (Phase 3)", () => {
  it("escapes the five XML metacharacters", () => {
    expect(escapeXml(`<a b="c">&'`)).toBe("&lt;a b=&quot;c&quot;&gt;&amp;&apos;");
  });
});

// ---------------------------------------------------------------------
// validateCapAlert
// ---------------------------------------------------------------------
describe("validateCapAlert (Phase 3 validator)", () => {
  it("passes a well-formed alert", () => {
    const result = validateCapAlert(validInput());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects missing mandatory fields", () => {
    const input = validInput();
    input.infos[0].description = "";
    input.infos[0].areas = [];
    input.scope = "" as CapAlertInput["scope"];
    const result = validateCapAlert(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("description"))).toBe(true);
    expect(result.errors.some((e) => e.includes("area is required"))).toBe(true);
    expect(result.errors.some((e) => e.includes("scope"))).toBe(true);
  });

  it("rejects out-of-enum values", () => {
    const result = validateCapAlert(
      validInput({ msgType: "Broadcast" as unknown as CapAlertInput["msgType"] }),
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("msgType");
  });

  it("rejects polygon+circle on the same area", () => {
    const input = validInput();
    input.infos[0].areas = [
      {
        areaDesc: "both",
        polygon: [
          [85.1, 25.5],
          [85.2, 25.5],
          [85.2, 25.6],
        ],
        circle: [85.14, 25.59, 50],
      },
    ];
    const result = validateCapAlert(input);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("polygon OR circle");
  });

  it("rejects expires before effective", () => {
    const input = validInput();
    input.infos[0].expires = input.infos[0].effective;
    const result = validateCapAlert(input);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("expires"))).toBe(true);
  });
});

// ---------------------------------------------------------------------
// validateCapXml (structural path — no native XSD binding)
// ---------------------------------------------------------------------
describe("validateCapXml (Phase 3)", () => {
  it("accepts builder output", async () => {
    const xml = buildCapAlert(validInput());
    const result = await validateCapXml(xml);
    expect(result.ok).toBe(true);
  });

  it("rejects malformed XML documents", async () => {
    const result = await validateCapXml("<alert><sender>x</sender></alert>");
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------
// cap-templates
// ---------------------------------------------------------------------
describe("disasterCapPreset (Phase 3 templates)", () => {
  it("pre-fills flood as Met/Immediate/Severe/Observed", () => {
    const preset = disasterCapPreset("flood");
    expect(preset).toMatchObject({
      category: "Met",
      event: "Flood",
      urgency: "Immediate",
      severity: "Severe",
      certainty: "Observed",
    });
    expect(preset.instruction).toContain("Move to higher ground");
  });

  it("pre-fills cyclone as Met/Immediate/Extreme/Likely", () => {
    const preset = disasterCapPreset("cyclone");
    expect(preset).toMatchObject({
      category: "Met",
      event: "Cyclone",
      urgency: "Immediate",
      severity: "Extreme",
      certainty: "Likely",
    });
  });

  it("pre-fills earthquake as Geo/Immediate/Severe/Observed", () => {
    const preset = disasterCapPreset("earthquake");
    expect(preset).toMatchObject({
      category: "Geo",
      event: "Earthquake",
      urgency: "Immediate",
      severity: "Severe",
      certainty: "Observed",
    });
  });
});

describe("resolveCapPreset + districtHeadline (Phase 3 overrides)", () => {
  it("applies the Bihar flood district override", () => {
    const preset = resolveCapPreset({ disasterType: "flood", district: "bihar" });
    expect(preset.description).toContain("across Bihar");
  });

  it("applies the Odisha/Puri cyclone instruction override", () => {
    const puri = resolveCapPreset({ disasterType: "cyclone", district: "Puri" });
    expect(puri.instruction).toContain("Do not return until");
    const generic = resolveCapPreset({ disasterType: "cyclone", district: "Kolkata" });
    expect(generic.instruction).toContain("Move to the nearest cyclone shelter");
  });

  it("honors explicit severity/urgency overrides", () => {
    const preset = resolveCapPreset({
      disasterType: "heatwave",
      district: "Delhi",
      severity: "Extreme",
      urgency: "Immediate",
    });
    expect(preset.severity).toBe("Extreme");
    expect(preset.urgency).toBe("Immediate");
  });

  it("names the district in the headline", () => {
    const preset = disasterCapPreset("flood");
    expect(districtHeadline(preset, "Patna")).toBe("Flood Warning: Patna");
    expect(districtHeadline(preset, "")).toBe(preset.headline);
  });
});
