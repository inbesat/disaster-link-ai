// ---------------------------------------------------------------------
// lib/offline-sync/model-integrity.test.ts — Phase 9 SHA-256 integrity
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { getOfflineDb } from "./db";
import {
  sha256Hex,
  sha256Available,
  hashStoredChunk,
  verifyChunkHashes,
  reDownloadChunks,
} from "./model-integrity";

let counter = 0;
const uniqueDb = () => `integrity-${counter++}-${Math.random().toString(36).slice(2, 8)}`;

const CHUNK = (byte: number) => new Blob([new Uint8Array([byte, byte, byte])]);

describe("sha256Hex / sha256Available", () => {
  it("computes the SHA-256 digest of known bytes", async () => {
    const text = "hello world";
    const bytes = new TextEncoder().encode(text);
    const hex = await sha256Hex(bytes);
    // Known digest of "hello world".
    expect(hex).toBe("b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  });

  it("computes the same digest for an equivalent Blob", async () => {
    const text = new TextEncoder().encode("abc");
    const fromBytes = await sha256Hex(text);
    const fromBlob = await sha256Hex(new Blob([text]));
    expect(fromBytes).toBe(fromBlob);
  });

  it("reports crypto availability (node 18+/browser expose crypto.subtle)", () => {
    expect(sha256Available()).toBe(true);
  });
});

describe("hashStoredChunk / verifyChunkHashes", () => {
  it("verifies all chunks against expected hashes", async () => {
    const db = getOfflineDb(uniqueDb());
    const blobs = [CHUNK(1), CHUNK(2), CHUNK(3)];
    await db.gemmaModel.bulkPut(
      blobs.map((bytes, i) => ({
        id: i,
        chunkIndex: i,
        totalChunks: 3,
        bytes,
        downloadedAt: new Date().toISOString(),
      })),
    );
    const expected = await Promise.all(blobs.map((b) => sha256Hex(b)));
    const { corrupt, verified } = await verifyChunkHashes(db, "gemma", expected);
    expect(verified).toBe(3);
    expect(corrupt).toEqual([]);
  });

  it("flags a chunk whose stored bytes were corrupted", async () => {
    const db = getOfflineDb(uniqueDb());
    const blobs = [CHUNK(1), CHUNK(2)];
    await db.gemmaModel.bulkPut(
      blobs.map((bytes, i) => ({
        id: i,
        chunkIndex: i,
        totalChunks: 2,
        bytes,
        downloadedAt: new Date().toISOString(),
      })),
    );
    // Corrupt chunk 1 by replacing its bytes.
    await db.gemmaModel.update(1, { bytes: CHUNK(9) });
    const expected = await Promise.all(blobs.map((b) => sha256Hex(b)));
    const { corrupt } = await verifyChunkHashes(db, "gemma", expected);
    expect(corrupt).toEqual([1]);
  });

  it("flags a missing chunk as corrupt", async () => {
    const db = getOfflineDb(uniqueDb());
    await db.gemmaModel.put({
      id: 0,
      chunkIndex: 0,
      totalChunks: 2,
      bytes: CHUNK(5),
      downloadedAt: new Date().toISOString(),
    });
    const expected = [await sha256Hex(CHUNK(5)), await sha256Hex(CHUNK(6))];
    const { corrupt, verified } = await verifyChunkHashes(db, "gemma", expected);
    expect(corrupt).toEqual([1]); // chunk 1 was never written
    expect(verified).toBe(1);
  });

  it("treats all chunks as corrupt when db is null (SSR-safe)", async () => {
    const { corrupt, verified } = await verifyChunkHashes(null, "gemma", ["a", "b"]);
    expect(verified).toBe(0);
    expect(corrupt).toEqual([0, 1]);
  });
});

describe("reDownloadChunks", () => {
  it("repairs corrupted chunks from a Range response", async () => {
    const db = getOfflineDb(uniqueDb());
    await db.gemmaModel.put({
      id: 1,
      chunkIndex: 1,
      totalChunks: 2,
      bytes: CHUNK(9), // wrong bytes
      downloadedAt: new Date().toISOString(),
    });
    const goodBytes = CHUNK(2); // correct content for chunk 1
    const expected = [await sha256Hex(CHUNK(1)), await sha256Hex(goodBytes)];

    // Fake fetch honors Range and returns only chunk 1's bytes.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = viFetchChunk(goodBytes);

    try {
      const { repaired, stillCorrupt } = await reDownloadChunks(
        db,
        "gemma",
        [1],
        "https://model.example/gemma.bin",
        3,
        expected,
      );
      expect(repaired).toBe(1);
      expect(stillCorrupt).toEqual([]);
      // The stored chunk now hashes correctly.
      const actual = await hashStoredChunk(db, "gemma", 1);
      expect(actual).toBe(expected[1]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("leaves chunks corrupt when the server returns wrong bytes", async () => {
    const db = getOfflineDb(uniqueDb());
    const expected = [await sha256Hex(CHUNK(1))];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = viFetchChunk(CHUNK(99)); // wrong content
    try {
      const { repaired, stillCorrupt } = await reDownloadChunks(
        db,
        "gemma",
        [0],
        "https://model.example/gemma.bin",
        3,
        expected,
      );
      expect(repaired).toBe(0);
      expect(stillCorrupt).toEqual([0]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns no-op when db is null or no chunks requested", async () => {
    expect(await reDownloadChunks(null, "gemma", [0], "https://x")).toEqual({
      repaired: 0,
      stillCorrupt: [0],
    });
    expect(await reDownloadChunks(getOfflineDb(uniqueDb()), "gemma", [], "https://x")).toEqual({
      repaired: 0,
      stillCorrupt: [],
    });
  });
});

/** Returns a fetch stub that serves `blob` for any Range request. */
function viFetchChunk(blob: Blob): typeof fetch {
  return (async () => {
    return {
      ok: true,
      status: 206,
      arrayBuffer: async () => blob.arrayBuffer(),
      headers: { get: () => null },
    } as unknown as Response;
  }) as unknown as typeof fetch;
}
