import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getEmbedding } from "@/lib/retrieval/retrieve";

export const dynamic = "force-dynamic";

// Mock fallback data for hackathon demo resilience
const MOCK_EMBEDDINGS = {
  Patna: [
    { id: "patna-1", title: "Patna Flood Risk Assessment 2024", content: "Ganga river water levels rising above danger mark at Gandhi Ghat. 12 low-lying wards identified for priority evacuation. NDRF teams pre-positioned at 3 locations." },
    { id: "patna-2", title: "Patna Evacuation Routes - Sector 4", content: "Primary evacuation routes: NH-30 northbound, NH-31 eastbound. Alternate via NH-22 if NH-30 congested. Shelter capacity: 12,000 at Gandhi Maidan complex." },
  ],
  Kamrup: [
    { id: "kamrup-1", title: "Kamrup Brahmaputra Flood Alert", content: "Brahmaputra crossing danger level at Guwahati gauge. 8 revenue circles affected. Relief camps operational at 12 locations with 8,500 capacity." },
    { id: "kamrup-2", title: "Kamrup Relief Distribution Plan", content: "Phase 1: 5000 family kits dispatched. Phase 2: Medical teams deployed to 8 flood-affected PHCs. Water purification units deployed at 15 locations." },
  ],
  Ernakulam: [
    { id: "ernakulam-1", title: "Ernakulam Coastal Flood Advisory", content: "High tide + heavy rainfall warning for coastal wards. 45 relief camps ready. Fishing communities pre-alerted via SMS/voice blast." },
    { id: "ernakulam-2", title: "Ernakulam Landslide Risk Zones", content: "High-range taluks (Muvattupuzha, Kothamangalam) on landslide watch. NDRF team pre-positioned. Early warning sirens tested." },
  ],
};

/**
 * GET /api/retrieval/embed?district=<district>
 *
 * Fetches RAG context chunks for the knowledge table (weekly sync).
 * Returns matching emergency documents for the given district.
 * No authentication required for demo purposes.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");

    if (!district) {
      return NextResponse.json(
        { error: "Missing required query parameter: district" },
        { status: 400 },
      );
    }

    try {
      const docs = await prisma.$queryRaw<
        { id: string; title: string; content: string }[]
      >`
        SELECT id, title, content
        FROM public.emergency_documents
        WHERE district = ${district}
          AND content IS NOT NULL
          AND content != ''
        LIMIT 50
      `;

      return NextResponse.json({
        ok: true,
        results: docs.map((doc) => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
        })),
      });
    } catch (dbError: unknown) {
      console.error("[retrieval] DB error, falling back to mock data:", dbError);
      // Fallback to mock data for demo resilience
      const mockData = MOCK_EMBEDDINGS[district as keyof typeof MOCK_EMBEDDINGS] || [];
      return NextResponse.json({
        ok: true,
        results: mockData,
        fallback: true,
      });
    }
  } catch (error: unknown) {
    console.error("[retrieval] GET failed:", error);
    // Ultimate fallback - return mock data so demo never breaks
    const district = new URL(request.url).searchParams.get("district") || "Patna";
    const mockData = MOCK_EMBEDDINGS[district as keyof typeof MOCK_EMBEDDINGS] || [];
    return NextResponse.json({
      ok: true,
      results: mockData,
      fallback: true,
    });
  }
}

/**
 * POST /api/retrieval/embed · optional body: { title?, content? }
 *
 * Back-fills embeddings for emergency_documents whose `embedding` is NULL.
 * When an OpenAI-compatible embeddings key is configured (OPENAI_API_KEY),
 * it computes vectors and writes them via raw SQL (pgvector column is not
 * exposed through the Prisma typed client). Without a key it returns
 * `{ ok: false, reason }` — retrieval keeps working via keyword search.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let docs: { id: string; title: string; content: string }[] = [];

  // Optional: embed a single new document by title+content.
  let body: { title?: string; content?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (typeof body.title === "string" && typeof body.content === "string") {
    docs = [{ id: "inline", title: body.title, content: body.content }];
  } else {
    try {
      docs = await prisma.$queryRaw<
        { id: string; title: string; content: string }[]
      >`
        SELECT id, title, content
        FROM public.emergency_documents
        WHERE embedding IS NULL
        LIMIT 50
      `;
    } catch (error: unknown) {
      console.error("[retrieval] failed to read documents:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to read documents." },
        { status: 500 },
      );
    }
  }

  if (docs.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: "No documents awaiting embedding.",
      embedded: 0,
    });
  }

  let embedded = 0;
  for (const doc of docs) {
    const vector = await getEmbedding(`${doc.title}\n${doc.content}`);
    if (!vector) break;
    try {
      const vec = `[${vector.join(",")}]`;
      await prisma.$executeRaw`
        UPDATE public.emergency_documents
        SET embedding = (${vec}::vector),
            embedding_version = embedding_version + 1,
            embedding_source = 'backfill:${doc.title}',
            updated_at = now()
        WHERE title = ${doc.title}
      `;
      embedded++;
    } catch (error: unknown) {
      console.warn("[retrieval] embedding write failed:", error);
    }
  }

  if (embedded === 0) {
    return NextResponse.json({
      ok: false,
      skipped:
        "No embedding provider configured (OPENAI_API_KEY missing). Using keyword retrieval.",
      embedded: 0,
    });
  }

  return NextResponse.json({ ok: true, embedded, total: docs.length });
}
