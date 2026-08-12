// ---------------------------------------------------------------------
// lib/cap/cap-hash.test.ts — Phase 8 · CAP tamper-proofing digest.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { hashCapXml, verifyCapHash } from "./cap-hash";

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>dl-abc123-k2m3x</identifier>
  <headline>FLASH FLOOD WARNING — PATNA</headline>
</alert>`;

describe("hashCapXml (Phase 8)", () => {
  it("produces a stable 64-char SHA-256 hex digest", () => {
    const hash = hashCapXml(SAMPLE_XML);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashCapXml(SAMPLE_XML)).toBe(hash); // deterministic
  });

  it("changes when the XML content changes (tamper-evident)", () => {
    const original = hashCapXml(SAMPLE_XML);
    const tampered = hashCapXml(SAMPLE_XML.replace("FLASH FLOOD", "FLASH FIRE"));
    expect(tampered).not.toBe(original);
  });

  it("verifyCapHash accepts a matching hash and rejects mismatches", () => {
    const hash = hashCapXml(SAMPLE_XML);
    expect(verifyCapHash(SAMPLE_XML, hash)).toBe(true);
    expect(verifyCapHash(SAMPLE_XML, hashCapXml("different"))).toBe(false);
    expect(verifyCapHash(SAMPLE_XML, null)).toBe(false);
    expect(verifyCapHash(SAMPLE_XML, "")).toBe(false);
  });
});
