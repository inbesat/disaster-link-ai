// ---------------------------------------------------------------------
// lib/rag/embeddings.ts
// Converts text chunks into vector embeddings for the RAG pipeline.
//
// Uses the OpenAI client (text-embedding-3-small → 1536 dims). If the API key
// is missing or the call fails (no key, bad key, rate-limit, or a provider
// that doesn't offer embeddings — e.g. DeepSeek), we return deterministic mock
// vectors so the hackathon pipeline never crashes and the rest of the chain
// (chunk → embed → store → retrieve) can still be exercised end-to-end.
// ---------------------------------------------------------------------

import OpenAI from "openai";

export type EmbeddedChunk = {
  text: string;
  embedding: number[];
};

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

// Embeddings are OpenAI-specific (text-embedding-3-small is not served by
// DeepSeek), so pin the base URL to the OpenAI embeddings endpoint unless
// explicitly overridden.
const EMBEDDING_BASE_URL =
  process.env.OPENAI_EMBEDDING_BASE_URL || "https://api.openai.com/v1";

// Deterministic pseudo-random in [-1, 1] so mock vectors are stable per chunk
// (re-ingesting the same document yields the same vectors).
function seeded(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function mockVector(seed: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM);
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    vector[i] = Number((seeded(seed.charCodeAt(0) * 31 + i) * 2 - 1).toFixed(6));
  }
  return vector;
}

function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

// ---------------------------------------------------------------------
// In-memory LRU embedding cache (Step 9).
// Re-queries like "Give me evacuation SOPs" don't re-hit OpenAI — identical
// query text returns a cached vector instantly, saving API spend. A simple
// Map (last-access → re-insert at tail) approximates LRU; the oldest entry is
// evicted once the cache exceeds its cap.
// ---------------------------------------------------------------------
interface LruCache {
  map: Map<string, number[]>;
  hits: number;
  misses: number;
}

const CACHE_CAP = 512;

const cache: LruCache = { map: new Map(), hits: 0, misses: 0 };

/** Normalise a query string so trivial differences don't defeat the cache. */
function cacheKeyFor(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function cacheGet(key: string): number[] | undefined {
  const found = cache.map.get(key);
  if (found) {
    // Touch → move to the most-recently-used (tail) position.
    cache.map.delete(key);
    cache.map.set(key, found);
    cache.hits += 1;
    return found;
  }
  cache.misses += 1;
  return undefined;
}

function cacheSet(key: string, vector: number[]) {
  cache.map.delete(key);
  cache.map.set(key, vector);
  // Evict the least-recently-used (head) entry when over capacity.
  if (cache.map.size > CACHE_CAP) {
    const oldest = cache.map.keys().next().value;
    if (oldest !== undefined) cache.map.delete(oldest);
  }
}

export type EmbeddingCacheStats = {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
};

/** Observable stats for the cost/transparency UI. */
export function getEmbeddingCacheStats(): EmbeddingCacheStats {
  return {
    size: cache.map.size,
    capacity: CACHE_CAP,
    hits: cache.hits,
    misses: cache.misses,
    hitRate: cache.hits + cache.misses === 0 ? 0 : cache.hits / (cache.hits + cache.misses),
    evictions: 0,
  };
}

/**
 * Generate an embedding vector for every provided chunk. Returns
 * `{ text, embedding }[]`. On any failure it degrades to deterministic mock
 * vectors so the ingestion flow completes without a hard crash. Identical
 * text already cached (Step 9) short-circuits to the stored vector.
 */
export async function generateEmbeddings(
  textChunks: string[],
): Promise<EmbeddedChunk[]> {
  const cleanChunks = (textChunks ?? []).filter((c) => typeof c === "string" && c.length > 0);
  if (cleanChunks.length === 0) return [];

  // Split into chunks already cached (serve instantly) vs. those we must embed.
  const results: EmbeddedChunk[] = [];
  const pending: string[] = [];
  const keysOfPending: string[] = [];

  for (const chunk of cleanChunks) {
    const key = cacheKeyFor(chunk);
    const cached = cacheGet(key);
    if (cached) {
      results.push({ text: chunk, embedding: cached });
    } else {
      pending.push(chunk);
      keysOfPending.push(key);
    }
  }
  if (pending.length === 0) return results;

  // Embed only the pending batch (real OpenAI call, or mock fallback).
  const embeddedBatch = await embedBatch(pending);

  for (let i = 0; i < embeddedBatch.length; i++) {
    const item = embeddedBatch[i];
    cacheSet(keysOfPending[i], item.embedding);
    results.push(item);
  }

  return results;
}

/** Single OpenAI (or mock) embedding call for a batch of uncached chunks. */
async function embedBatch(chunks: string[]): Promise<EmbeddedChunk[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[rag] No OPENAI_API_KEY — returning mock embeddings.");
    return chunks.map((text) => ({ text, embedding: mockVector(text) }));
  }

  const client = new OpenAI({ apiKey, baseURL: EMBEDDING_BASE_URL });

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: chunks,
    });
    const data = response.data;
    if (!data?.length) throw new Error("Empty embeddings response.");

    return chunks.map((text, index) => {
      const raw = data[index]?.embedding;
      const embedding = Array.isArray(raw) && raw.length > 0 ? normalize(raw) : mockVector(text);
      return { text, embedding };
    });
  } catch (error) {
    console.warn("[rag] Embedding call failed — returning mock embeddings.", error);
    return chunks.map((text) => ({ text, embedding: mockVector(text) }));
  }
}