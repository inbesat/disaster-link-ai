// ---------------------------------------------------------------------
// lib/rag/vector-search.ts
// Semantic retrieval over the emergency_documents knowledge base.
//
// searchSimilarDocuments() embeds a natural-language query, then runs a
// pgvector cosine-distance search (<=>) over the stored SOP chunks. The
// optional districtFilter scopes results to one district so e.g. Patna
// commanders only retrieve Patna SOPs. Degrades to a mock result array when
// the database is bypassed so the demo never crashes.
// ---------------------------------------------------------------------

import { Prisma } from "@prisma/client";
import { prisma } from "@/server/prisma";
import { generateEmbeddings } from "@/lib/rag/embeddings";

export type SimilarDocument = {
  title: string;
  content: string;
  docType: string | null;
  score: number;
};

const MOCK_RESULTS: SimilarDocument[] = [
  {
    title: "Flood Evacuation Standard Operating Procedure",
    content:
      "In a CRITICAL flood risk, the District Control Room must place affected riverside wards under EVACUATE status, activate the Mass Evacuation Planner, deploy boats and buses, broadcast an alert, and track convoys until all villages are marked COMPLETE.",
    docType: "procedure",
    score: 0.92,
  },
  {
    title: "Shelter Management & Capacity Protocol",
    content:
      "Shelters accept evacuees while current_occupancy is below capacity. When a shelter reaches capacity, set its status to FULL and route evacuees to the next nearest open shelter.",
    docType: "procedure",
    score: 0.87,
  },
  {
    title: "Flood Risk Levels and Responses",
    content:
      "Risk levels GATE: SAFE no action; WATCH continue monitoring and pre-position boats; WARNING prepare evacuation; EVACUATE move people to shelters immediately.",
    docType: "report",
    score: 0.81,
  },
];

/**
 * Return the top-K most similar document chunks for `query`, optionally
 * scoped to a single district. Returns an empty array for a blank query and a
 * mock array when the DB is unavailable.
 */
export async function searchSimilarDocuments(
  query: string,
  districtFilter?: string | null,
  topK = 3,
): Promise<SimilarDocument[]> {
  const normalizedQuery = (query ?? "").toString().trim();
  if (!normalizedQuery) return [];

  // 1) Embed the query (mock vectors are produced when no key is configured,
  //    so this call still returns a stable 1536-dim vector to search on).
  const [embedded] = await generateEmbeddings([normalizedQuery]);
  if (!embedded) return [];

  const vectorLiteral = `[${embedded.embedding.join(",")}]`;

  try {
    const districtClause = districtFilter
      ? Prisma.sql`AND metadata->>'district' = ${districtFilter}`
      : Prisma.empty;

    // 2) Cosine-distance search, ordered by similarity, scoped by district.
    const rows = await prisma.$queryRaw<
      Array<{ title: string; content: string; docType: string | null; score: number }>
    >`
      SELECT title AS "title",
             content AS "content",
             doc_type AS "docType",
             1 - (embedding <=> ${vectorLiteral}::vector) AS "score"
      FROM public.emergency_documents
      WHERE embedding IS NOT NULL
        ${districtClause}
      ORDER BY embedding <=> ${vectorLiteral}::vector
      LIMIT ${topK}
    `;

    if (rows.length === 0) {
      // 3) Empty result set (e.g. a district filter that has no documents yet):
      //    fall back to keyword-unfiltered retrieval so the demo still returns
      //    useful context.
      const fallback = await prisma.emergencyDocument.findMany({
        take: topK,
        select: { title: true, content: true, docType: true },
      });
      return fallback.map((doc) => ({
        title: doc.title,
        content: doc.content,
        docType: doc.docType,
        score: 0,
      }));
    }

    return rows.map((row) => ({
      title: row.title,
      content: row.content,
      docType: row.docType,
      score: Number(row.score),
    }));
  } catch (error) {
    console.warn("[rag] vector search failed — returning mock results.", error);
    return MOCK_RESULTS.slice(0, topK);
  }
}