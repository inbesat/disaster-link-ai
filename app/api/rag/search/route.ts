import { NextRequest, NextResponse } from "next/server";
import { searchSimilarDocuments } from "@/lib/rag/vector-search";
import { createRateLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

// Rate limit: 10 RAG searches per minute per IP
const ragSearchLimiter = createRateLimiter(10, 60_000);

// ---------------------------------------------------------------------
// POST /api/rag/search
// Transparency endpoint backing the RAGDebugger UI. Executes a vector
// similarity search and returns the raw retrieved chunks with their cosine
// similarity scores so judges can see exactly what the AI would be grounded on.
// ---------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // Rate limit check
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";
  const rateResult = ragSearchLimiter(`ragsearch:${ip}`);
  if (!rateResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rateResult.resetTime - Date.now()) / 1000)) } },
    );
  }

  let body: { query?: string; district?: string | null; topK?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const query = (body.query ?? "").toString().trim();
  if (!query) {
    return NextResponse.json({ ok: false, error: "Query is required." }, { status: 400 });
  }

  const district =
    typeof body.district === "string" && body.district.length ? body.district : null;
  const topK = Math.min(Math.max(Number(body.topK) || 3, 1), 10);

  // Vector search can fail when pgvector/DB is unreachable (e.g. a Vercel
  // cold start). Never 500 — degrade to empty results so the debug UI stays
  // alive.
  let results: Awaited<ReturnType<typeof searchSimilarDocuments>> = [];
  try {
    results = await searchSimilarDocuments(query, district, topK);
  } catch (error) {
    console.error("RAG search failed (returning empty results):", error);
  }

  return NextResponse.json({
    ok: true,
    query,
    district,
    topK,
    count: results.length,
    results,
  });
}
