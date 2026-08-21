import { describe, expect, it } from "vitest";
import {
  clampQueryLimit,
  validatePolygonComplexity,
  validateFileUploadSize,
  validateBroadcastSize,
  validateAiPromptLength,
} from "./resource-guards";

describe("Resource Exhaustion Guards", () => {
  it("clamps query row limits to maximum 1000", () => {
    expect(clampQueryLimit(50)).toBe(50);
    expect(clampQueryLimit(2000)).toBe(1000);
    expect(clampQueryLimit(0)).toBe(1000);
    expect(clampQueryLimit(undefined)).toBe(1000);
  });

  it("validates GeoJSON polygon vertex complexity", () => {
    const simplePolygon = {
      type: "Polygon",
      coordinates: [
        [
          [85.1, 25.6],
          [85.2, 25.6],
          [85.2, 25.7],
          [85.1, 25.7],
          [85.1, 25.6],
        ],
      ],
    };
    const simpleRes = validatePolygonComplexity(simplePolygon);
    expect(simpleRes.valid).toBe(true);
    expect(simpleRes.vertexCount).toBe(5);

    // Create dense polygon exceeding 500 vertices
    const denseCoords = Array.from({ length: 505 }, (_, i) => [85.0 + i * 0.001, 25.0 + i * 0.001]);
    const denseRes = validatePolygonComplexity({ type: "Polygon", coordinates: [denseCoords] });
    expect(denseRes.valid).toBe(false);
    expect(denseRes.vertexCount).toBe(505);
    expect(denseRes.reason).toContain("exceeds limit");
  });

  it("validates file upload sizes for images (5MB) and documents (10MB)", () => {
    const validImage = validateFileUploadSize(4 * 1024 * 1024, "image/png");
    expect(validImage.valid).toBe(true);

    const oversizedImage = validateFileUploadSize(6 * 1024 * 1024, "image/jpeg");
    expect(oversizedImage.valid).toBe(false);

    const validDoc = validateFileUploadSize(8 * 1024 * 1024, "application/pdf");
    expect(validDoc.valid).toBe(true);

    const oversizedDoc = validateFileUploadSize(12 * 1024 * 1024, "application/pdf");
    expect(oversizedDoc.valid).toBe(false);
  });

  it("validates broadcast recipient size and calculates batching", () => {
    const smallBroadcast = validateBroadcastSize(10_000);
    expect(smallBroadcast.valid).toBe(true);
    expect(smallBroadcast.batchNeeded).toBe(false);

    const largeBroadcast = validateBroadcastSize(120_000);
    expect(largeBroadcast.valid).toBe(false);
    expect(largeBroadcast.batchNeeded).toBe(true);
    expect(largeBroadcast.batchCount).toBe(3);
  });

  it("validates AI prompt token length limits and truncates oversized prompts", () => {
    const normalPrompt = "What is the emergency evacuation route for District Patna?";
    const normalRes = validateAiPromptLength(normalPrompt);
    expect(normalRes.valid).toBe(true);

    const oversizedPrompt = "a".repeat(20_000);
    const oversizedRes = validateAiPromptLength(oversizedPrompt);
    expect(oversizedRes.valid).toBe(false);
    expect(oversizedRes.truncatedText?.length).toBe(16_000);
  });
});
