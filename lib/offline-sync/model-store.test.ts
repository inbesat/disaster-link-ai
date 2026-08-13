// ---------------------------------------------------------------------
// lib/offline-sync/model-store.test.ts
// Phase 3 · resumable chunked model download: progressive writes, pause /
// resume with Range headers, manifest lifecycle and delete.
// ---------------------------------------------------------------------

import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelChunkStore } from "./model-store";
import { getOfflineDb } from "./db";

let counter = 0;
const uniqueDb = () => `model-test-${counter++}-${Math.random().toString(36).slice(2, 8)}`;

const MODEL_ID = "gemma-2b-it-q4f16_1";
const URL = "https://models.example.com/gemma.bin";

function encodeBody(bytes: number): Uint8Array {
  const body = new Uint8Array(bytes);
  for (let i = 0; i < bytes; i++) body[i] = i % 256;
  return body;
}

/** Streaming fetch mock with optional Range handling + abort detection. */
function streamingFetch(body: Uint8Array, { supportRange = true } = {}) {
  return vi.fn((_url: RequestInfo | URL, init: RequestInit = {}) => {
    const rangeHeader = (init.headers as Record<string, string> | undefined)?.["Range"];
    const start = supportRange && rangeHeader ? Number(rangeHeader.match(/^bytes=(\d+)-/)?.[1] ?? 0) : 0;
    const slice = body.slice(start);
    let offset = 0;
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (init.signal?.aborted) {
          controller.error(new DOMException("aborted", "AbortError"));
          return;
        }
        if (offset >= slice.length) {
          controller.close();
          return;
        }
        const chunk = slice.slice(offset, offset + 8192);
        offset += chunk.length;
        controller.enqueue(chunk);
      },
    });
    const headers = new Headers();
    if (supportRange) headers.set("content-range", `bytes ${start}-${body.length - 1}/${body.length}`);
    return Promise.resolve(
      new Response(stream, { status: supportRange && start > 0 ? 206 : 200, headers }),
    );
  });
}

describe("ModelChunkStore", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("downloads a body and splits it into chunks of the configured size", async () => {
    const db = getOfflineDb(uniqueDb());
    const store = new ModelChunkStore({
      dbName: db.name,
      chunkSize: 4 * 1024 * 1024,
      fetchFn: streamingFetch(encodeBody(10 * 1024 * 1024)),
    });
    const result = await store.download(MODEL_ID, URL, 10 * 1024 * 1024);
    expect(result?.status).toBe("complete");
    expect(result?.totalBytes).toBe(10 * 1024 * 1024);
    expect(result?.fraction).toBe(1);
    expect(await db.gemmaModel.count()).toBe(3); // 4MB + 4MB + 2MB
    expect(await db.metadata.get("model:manifest")).toBeDefined();
  });

  it("resumes from the stored chunk count using a Range header", async () => {
    const db = getOfflineDb(uniqueDb());
    const body = encodeBody(8 * 1024 * 1024);

    // Seed the manifest + first chunk exactly as pause() leaves them.
    await db.gemmaModel.put({
      id: 0,
      chunkIndex: 0,
      totalChunks: 2,
      bytes: new Blob([body.slice(0, 4 * 1024 * 1024)]),
      downloadedAt: new Date().toISOString(),
    });
    await db.metadata.put({
      key: "model:manifest",
      value: {
        version: 1,
        modelId: MODEL_ID,
        totalBytes: 8 * 1024 * 1024,
        chunkSize: 4 * 1024 * 1024,
        totalChunks: 2,
        lastChunkIndex: 0,
        status: "paused",
        baseUrl: URL,
        updatedAt: new Date().toISOString(),
      } as unknown as string,
    });

    // Resume fetch must request bytes=4194304- (skip the stored chunk).
    const fetchFn = vi.fn((url: RequestInfo | URL, init: RequestInit = {}) => {
      const headers = init.headers as Record<string, string> | undefined;
      expect(headers?.["Range"]).toBe("bytes=4194304-");
      return Promise.resolve(
        new Response(new Blob([body.slice(4 * 1024 * 1024)]).stream(), { status: 206 }),
      );
    });

    const store = new ModelChunkStore({
      dbName: db.name,
      chunkSize: 4 * 1024 * 1024,
      fetchFn,
    });
    const result = await store.download(MODEL_ID, URL, 8 * 1024 * 1024);
    expect(result?.status).toBe("complete");
    expect(await db.gemmaModel.count()).toBe(2); // chunk 0 + resumed chunk 1
  });

  it("pause() aborts an in-flight download and marks the manifest paused", async () => {
    const db = getOfflineDb(uniqueDb());
    const body = encodeBody(10 * 1024 * 1024);
    const store = new ModelChunkStore({
      dbName: db.name,
      chunkSize: 4 * 1024 * 1024,
      fetchFn: streamingFetch(body),
    });
    const promise = store.download(MODEL_ID, URL, 10 * 1024 * 1024);
    // Let a chunk land, then pause.
    await new Promise((r) => setTimeout(r, 30));
    await store.pause();
    const result = await promise;
    expect(result?.status).toBe("paused");
    const chunks = await db.gemmaModel.count();
    expect(chunks).toBeGreaterThan(0);
    expect(chunks).toBeLessThan(3);
  });

  it("deleteModel() clears chunks + manifest", async () => {
    const db = getOfflineDb(uniqueDb());
    const store = new ModelChunkStore({
      dbName: db.name,
      chunkSize: 4 * 1024 * 1024,
      fetchFn: streamingFetch(encodeBody(4 * 1024 * 1024)),
    });
    await store.download(MODEL_ID, URL, 4 * 1024 * 1024);
    expect(await db.gemmaModel.count()).toBe(1);
    await store.deleteModel(MODEL_ID);
    expect(await db.gemmaModel.count()).toBe(0);
    expect(await db.metadata.get("model:manifest")).toBeUndefined();
  });

  it("getState() reports idle before any download", async () => {
    const db = getOfflineDb(uniqueDb());
    const store = new ModelChunkStore({ dbName: db.name });
    const state = await store.getState(MODEL_ID);
    expect(state.status).toBe("idle");
    expect(state.fraction).toBe(0);
  });
});