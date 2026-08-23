import { describe, it, expect } from "vitest";
import { buildRagSourcesPayload, type RagSourcePayload } from "./sources-payload";

function mkVector(title: string, opts: { docType?: string; score?: number; content?: string } = {}): SimilarDocument {
  return {
    title,
    docType: opts.docType ?? null,
    score: opts.score ?? 0.9,
    content: opts.content ?? "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(3),
  };
}

function mkFallback(title: string, opts: { docType?: string; score?: number; content?: string } = {}): RetrievedDocument {
  return {
    id: `id-${title}`,
    title,
    docType: opts.docType ?? null,
    score: opts.score ?? undefined,
    content: opts.content ?? "Fallback content for " + title,
  };
}

describe("buildRagSourcesPayload", () => {
  it("returns empty array when both inputs empty", () => {
    const out = buildRagSourcesPayload([], []);
    expect(out).toEqual([]);
  });

  it("includes vector hits with score and snippet", () => {
    const hits = [mkVector("Evac SOP", { score: 0.9234, docType: "procedure" })];
    const out = buildRagSourcesPayload(hits, []);
    expect(out.length).toBe(1);
    expect(out[0]).toMatchObject({
      title: "Evac SOP",
      docType: "procedure",
      score: 0.923,
    });
    expect(out[0].snippet).toContain("Lorem ipsum");
    expect(out[0].snippet.length).toBeLessThanOrEqual(180);
  });

  it("falls back to keyword docs when vector hits empty", () => {
    const fallbacks = [mkFallback("NDMA Guideline", { docType: "guideline" })];
    const out = buildRagSourcesPayload([], fallbacks);
    expect(out.length).toBe(1);
    expect(out[0]).toMatchObject({
      title: "NDMA Guideline",
      docType: "guideline",
      score: null,
    });
  });

  it("deduplicates by title (vector hit wins over fallback)", () => {
    const hits = [mkVector("Shared Title", { docType: "procedure", score: 0.95 })];
    const fallbacks = [mkFallback("Shared Title", { docType: "guideline" })];
    const out = buildRagSourcesPayload(hits, fallbacks);
    expect(out.length).toBe(1);
    expect(out[0].docType).toBe("procedure");
    expect(out[0].score).toBe(0.95);
  });

  it("respects max cap (default 4)", () => {
    const hits = Array.from({ length: 6 }, (_, i) => mkVector(`Doc ${i + 1}`));
    const out = buildRagSourcesPayload(hits, []);
    expect(out.length).toBe(4);
  });

  it("snippet truncates long content with ellipsis", () => {
    const long = "A".repeat(300);
    const hits = [mkVector("Long Doc", { content: long })];
    const out = buildRagSourcesPayload(hits, []);
    expect(out[0].snippet.length).toBe(180);
    expect(out[0].snippet.endsWith("…")).toBe(true);
  });

  it("keeps short snippets intact", () => {
    const hits = [mkVector("Short Doc", { content: "Brief." })];
    const out = buildRagSourcesPayload(hits, []);
    expect(out[0].snippet).toBe("Brief.");
  });

  it("snippet normalizes whitespace", () => {
    const hits = [mkVector("WS Doc", { content: "  Multiple   spaces\tand\nnewlines  " })];
    const out = buildRagSourcesPayload(hits, []);
    expect(out[0].snippet).toBe("Multiple spaces and newlines");
  });
});

type SimilarDocument = {
  title: string;
  content: string;
  docType: string | null;
  score: number;
};

type RetrievedDocument = {
  id: string;
  title: string;
  content: string;
  docType: string | null;
  score?: number;
};