// ---------------------------------------------------------------------
// lib/mock-data/document-scanner.test.ts — Phase 6 · Step 9 · mock OCR
// semantics (pure, no browser required).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { mockOcrRecognize } from "./document-scanner";

describe("mockOcrRecognize", () => {
  it("returns a deterministic structured result", () => {
    const first = mockOcrRecognize("data:image/png;base64,AAAA", "aadhaar.png");
    const second = mockOcrRecognize("data:image/png;base64,BBBB", "other.png");
    expect(first).toEqual(second);
  });

  it("exposes a high confidence score", () => {
    expect(mockOcrRecognize("img").confidence).toBeGreaterThan(90);
  });

  it("extracts name, masked number and date of birth", () => {
    const { fields } = mockOcrRecognize("img");
    expect(fields.name).toBe("Priya Sharma");
    expect(fields.documentNumber).toMatch(/^X{4}-X{4}-\d{4}$/);
    expect(fields.dateOfBirth).toMatch(/\d{2} \w{3} \d{4}/);
  });

  it("returns a plausible raw text block", () => {
    const { text } = mockOcrRecognize("img");
    expect(text).toContain("Government of India");
    expect(text).toContain(fieldsOf().name);
  });
});

function fieldsOf() {
  return mockOcrRecognize("img").fields;
}
