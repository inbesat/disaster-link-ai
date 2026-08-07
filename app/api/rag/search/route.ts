import { NextRequest, NextResponse } from "next/server";
import { searchSimilarDocuments } from "@/lib/rag/vector-search";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------
// POST /api/rag/search
// Transparency endpoint backing the RAGDebugger UI. Executes a vector
// similarity search and returns the raw retrieved chunks with their cosine
// similarity scores so judges can see exactly what the AI would be grounded on.
// ---------------------------------------------------------------------
export async function POST(request: NextRequest) {
  let body: { query?: string; district?: string | null; topK?: number } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const query = (body.query ?? "").toString().trim();
  if (!query) {
    return NextResponse.json(
      { ok: false, error: "Query is required." },
      { status: 400 },
    );
  }

  const district =
    typeof body.district === "string" && body.district.length ? body.district : null;
  const topK = Math.min(Math.max(Number(body.topK) || 3, 1), 10);

  const results = await searchSimilarDocuments(query, district, topK);

  return NextResponse.json({
    ok: true,
    query,
    district,
    topK,
    count: results.length,
    results,
  });
}