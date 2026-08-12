import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/prisma";
import { getEmbedding } from "@/lib/retrieval/retrieve";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const GOV_ROLES = ["super_admin", "district_admin"] as const;

/**
 * POST /api/retrieval/embed · optional body: { title?, content? }
 *
 * Back-fills embeddings for emergency_documents whose `embedding` is NULL.
 * When an OpenAI-compatible embeddings key is configured (OPENAI_API_KEY),
 * it computes vectors and writes them via raw SQL (pgvector column is not
 * exposed through the Prisma typed client). Without a key it returns
 * `{ ok: false, reason }` — retrieval keeps working via keyword search.
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole(GOV_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
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
      const rows = await prisma.$queryRaw<
        { id: string; title: string; content: string }[]
      >`
        SELECT id, title, content
        FROM public.emergency_documents
        WHERE embedding IS NULL
        LIMIT 50
      `;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      docs = rows as any;
    } catch (error) {
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
    } catch (error) {
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
