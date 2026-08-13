// ---------------------------------------------------------------------
// lib/offline-sync/model-integrity.ts — Offline-First Architecture · Phase 9
// Model integrity checker: SHA-256 verification of every downloaded model
// chunk, so a corrupted chunk (partial write, disk error, interrupted
// Range response) is detected and re-downloaded instead of silently
// producing garbage model output.
//
//   const hashes = await computeChunkHashes(db, modelId);
//   const bad = await verifyChunkHashes(db, modelId, hashes);
//   if (bad.length) await reDownloadChunks(db, modelId, bad, url);
//
// Uses the browser Web Crypto API (crypto.subtle) — SSR-safe (returns a
// neutral result when unavailable). The expected hashes can come from the
// model manifest (extended with a per-chunk SHA-256 list) or from a
// trusted CDN manifest served alongside the model.
// ---------------------------------------------------------------------

import type { DisasterLinkDB } from "./db";
import { MODEL_CHUNK_SIZE } from "./model-store";

/** Hex digest of raw bytes using SHA-256 (Web Crypto). */
export async function sha256Hex(bytes: ArrayBuffer | Uint8Array | Blob): Promise<string> {
  const buffer =
    bytes instanceof Blob
      ? await bytes.arrayBuffer()
      : bytes instanceof Uint8Array
        ? (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer)
        : bytes;
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** True when the Web Crypto SHA-256 primitive is available in this context. */
export function sha256Available(): boolean {
  return (
    typeof crypto !== "undefined" &&
    typeof crypto.subtle !== "undefined" &&
    typeof crypto.subtle.digest === "function"
  );
}

/**
 * Computes the SHA-256 hex hash of one stored chunk. Returns null when the
 * chunk is missing or crypto is unavailable (verification then treats it
 * as corrupt — the safe failure mode).
 */
export async function hashStoredChunk(
  db: DisasterLinkDB | null,
  modelId: string,
  chunkIndex: number,
): Promise<string | null> {
  if (!db || !sha256Available()) return null;
  try {
    const chunk = await db.gemmaModel.get(chunkIndex);
    if (!chunk || !chunk.bytes || chunk.bytes.size === 0) return null;
    return await sha256Hex(chunk.bytes);
  } catch {
    return null;
  }
}

/**
 * Verifies every stored chunk of a model against its expected SHA-256
 * hashes. Returns the indices of chunks that are missing, unverifiable
 * (crypto unavailable), or whose hash does not match — plus the total
 * verified count.
 */
export async function verifyChunkHashes(
  db: DisasterLinkDB | null,
  modelId: string,
  expectedHashes: string[],
): Promise<{ corrupt: number[]; verified: number }> {
  const corrupt: number[] = [];
  if (!db || !sha256Available()) {
    return { corrupt: expectedHashes.map((_, i) => i), verified: 0 };
  }
  let verified = 0;
  for (let i = 0; i < expectedHashes.length; i += 1) {
    const actual = await hashStoredChunk(db, modelId, i);
    if (actual === null || actual.toLowerCase() !== expectedHashes[i].toLowerCase()) {
      corrupt.push(i);
    } else {
      verified += 1;
    }
  }
  return { corrupt, verified };
}

/** Hex hashes computed from a local manifest of chunk sizes (dev tooling). */
export async function computeHashesFromBlobs(blobs: Blob[]): Promise<string[]> {
  const hashes: string[] = [];
  for (const blob of blobs) hashes.push(await sha256Hex(blob));
  return hashes;
}

/**
 * Re-downloads specific corrupted chunks over HTTP Range requests and
 * replaces them in the store. Returns the number of chunks repaired.
 * A chunk that still fails to verify after `attempts` is left corrupt.
 */
export async function reDownloadChunks(
  db: DisasterLinkDB | null,
  modelId: string,
  chunkIndices: number[],
  baseUrl: string,
  chunkSize: number = MODEL_CHUNK_SIZE,
  expectedHashes?: string[],
  attempts = 2,
): Promise<{ repaired: number; stillCorrupt: number[] }> {
  if (!db || chunkIndices.length === 0) return { repaired: 0, stillCorrupt: chunkIndices };
  const repaired: number[] = [];

  for (const index of chunkIndices) {
    const start = index * chunkSize;
    const end = start + chunkSize - 1;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(baseUrl, {
          headers: { Range: `bytes=${start}-${end}` },
          cache: "no-store",
        });
        if (!response.ok && response.status !== 206) continue;
        const bytes = await response.arrayBuffer();
        if (bytes.byteLength === 0) continue;
        // Verify the freshly downloaded chunk before committing it.
        if (expectedHashes?.[index] && sha256Available()) {
          const digest = await sha256Hex(bytes);
          if (digest.toLowerCase() !== expectedHashes[index].toLowerCase()) continue;
        }
        await db.gemmaModel.put({
          id: index,
          chunkIndex: index,
          totalChunks: chunkIndices.length,
          bytes: new Blob([bytes]),
          downloadedAt: new Date().toISOString(),
        });
        repaired.push(index);
        break;
      } catch {
        // attempt again on transient network failures
      }
    }
  }

  const stillCorrupt = chunkIndices.filter((i) => !repaired.includes(i));
  return { repaired: repaired.length, stillCorrupt };
}

export default verifyChunkHashes;
