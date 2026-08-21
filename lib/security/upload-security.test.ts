import { describe, expect, it } from "vitest";
import {
  validateMagicNumbers,
  validateUploadFile,
  generateSecureFilename,
  stripJpegExif,
  calculateTargetDimensions,
} from "./upload-security";

describe("Upload & Storage Security Validation", () => {
  it("detects JPEG magic numbers (FF D8 FF)", () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const res = validateMagicNumbers(jpegHeader);
    expect(res.valid).toBe(true);
    expect(res.detectedMime).toBe("image/jpeg");
  });

  it("detects PNG magic numbers (89 50 4E 47)", () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const res = validateMagicNumbers(pngHeader);
    expect(res.valid).toBe(true);
    expect(res.detectedMime).toBe("image/png");
  });

  it("detects PDF magic numbers (%PDF)", () => {
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
    const res = validateMagicNumbers(pdfHeader);
    expect(res.valid).toBe(true);
    expect(res.detectedMime).toBe("application/pdf");
  });

  it("rejects SVG or HTML files disguised as images/documents", () => {
    const svgHeader = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>");
    const res = validateMagicNumbers(svgHeader);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain("scriptable file content detected");
  });

  it("enforces upload category size limits and MIME white-lists", () => {
    const jpegBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x00, 0x00]);
    const validRes = validateUploadFile(jpegBuffer, "image/jpeg", "avatar");
    expect(validRes.valid).toBe(true);
    expect(validRes.extension).toBe("jpg");

    // Exceed avatar 2MB limit
    const oversizedBuffer = new Uint8Array(3 * 1024 * 1024);
    oversizedBuffer.set([0xff, 0xd8, 0xff], 0);
    const oversizedRes = validateUploadFile(oversizedBuffer, "image/jpeg", "avatar");
    expect(oversizedRes.valid).toBe(false);
    expect(oversizedRes.reason).toContain("exceeds avatar limit");
  });

  it("generates safe, unguessable filenames without preserving raw original names", () => {
    const filename = generateSecureFilename("usr_123", "jpg");
    expect(filename).toMatch(/^usr_123_\d+_[a-f0-9-]+\.jpg$/);
    expect(filename).not.toContain("raw_original_name");
  });

  it("strips JPEG EXIF APP1 markers (0xFFE1) from buffer", () => {
    // Construct JPEG with APP1 (0xFFE1) marker
    const jpegWithExif = new Uint8Array([
      0xff, 0xd8,             // SOI
      0xff, 0xe1, 0x00, 0x06, 0x45, 0x78, 0x69, 0x66, // APP1 EXIF
      0xff, 0xd9,             // EOI
    ]);

    const stripped = stripJpegExif(jpegWithExif);
    expect(stripped[0]).toBe(0xff);
    expect(stripped[1]).toBe(0xd8);
    // EOI marker should remain, APP1 removed
    expect(stripped[2]).toBe(0xff);
    expect(stripped[3]).toBe(0xd9);
  });

  it("calculates avatar maximum dimension bounds (400x400)", () => {
    const dims = calculateTargetDimensions(1200, 800, 400);
    expect(dims.width).toBe(400);
    expect(dims.height).toBe(267);
  });
});
