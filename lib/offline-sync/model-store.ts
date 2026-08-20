// ---------------------------------------------------------------------
// lib/offline-sync/model-store.ts — Offline-First Architecture · Phase 3
// ModelChunkStore: resumable download of the ~1.3 GB 4-bit Gemma model
// into the browser's IndexedDB `gemmaModel` table.
//
//   • Chunked streaming — the body is read in fixed-size chunks and each
//     chunk is written to Dexie as soon as it arrives, so a tab crash or
//     manual pause loses at most one chunk.
//   • Resumable — the manifest (metadata table) records the last written
//     chunk + total size; resume() re-reads the body with an HTTP Range
//     header so already-downloaded bytes are skipped.
//   • Pause / resume / delete — pause() aborts the in-flight fetch and
//     persists "paused"; deleteModel() clears every chunk + the manifest.
//   • Progress events — emits `drip:model:*` window events so the Storage
//     Manager progress bar updates without polling.
//   • SSR-safe — every public method resolves to a safe no-op value when
//     IndexedDB is unavailable.
// ---------------------------------------------------------------------

import type { DisasterLinkDB } from "./db";
import { getOfflineDb, DEFAULT_DB_NAME } from "./db";
import type { ModelManifest } from "./types";

export const MODEL_EVENT = "drip:model:progress";
export const MODEL_EVENT_STATE = "drip:model:state";

export const MODEL_CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB per chunk

const MANIFEST_KEY = "model:manifest";

function emit(event: string, detail?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(event, { detail: detail ?? {} }));
}

export interface ModelDownloadProgress {
  modelId: string;
  downloadedBytes: number;
  totalBytes: number;
  chunksWritten: number;
  totalChunks: number;
  status: ModelManifest["status"];
  /** 0..1 fraction, 0 when totalBytes unknown. */
  fraction: number;
}

export interface ModelStoreOptions {
  dbName?: string;
  /** Chunk size in bytes (tests override to keep writes fast). */
  chunkSize?: number;
  /** Manual fetch implementation (tests). */
  fetchFn?: typeof fetch;
}

export class ModelChunkStore {
  private readonly dbName: string;
  private readonly chunkSize: number;
  private readonly fetchFn: typeof fetch;
  private abort: AbortController | null = null;
  private downloadPromise: Promise<ModelDownloadProgress | null> | null = null;

  constructor(options: ModelStoreOptions = {}) {
    this.dbName = options.dbName ?? DEFAULT_DB_NAME;
    this.chunkSize = options.chunkSize ?? MODEL_CHUNK_SIZE;
    this.fetchFn = options.fetchFn ?? ((...args) => fetch(...args));
  }

  private getDb(): DisasterLinkDB | null {
    if (typeof indexedDB === "undefined") return null;
    return getOfflineDb(this.dbName);
  }

  private async readManifest(db: DisasterLinkDB): Promise<ModelManifest | null> {
    const row = await db.metadata.get(MANIFEST_KEY);
    if (!row) return null;
    return row.value as unknown as ModelManifest;
  }

  private async writeManifest(db: DisasterLinkDB, manifest: ModelManifest): Promise<void> {
    await db.metadata.put({ key: MANIFEST_KEY, value: manifest as unknown as string });
  }

  /** Current download state — manifest + manifest-driven size estimate. */
  async getState(modelId: string): Promise<ModelDownloadProgress> {
    const db = this.getDb();
    const empty: ModelDownloadProgress = {
      modelId,
      downloadedBytes: 0,
      totalBytes: 0,
      chunksWritten: 0,
      totalChunks: 0,
      status: "idle",
      fraction: 0,
    };
    if (!db) return empty;
    try {
      const manifest = await this.readManifest(db);
      if (!manifest || manifest.modelId !== modelId) return empty;
      const chunksWritten = await db.gemmaModel.count();
      const downloadedBytes = manifest.totalChunks
        ? Math.min(chunksWritten * manifest.chunkSize, manifest.totalBytes)
        : chunksWritten * manifest.chunkSize;
      return {
        modelId,
        downloadedBytes,
        totalBytes: manifest.totalBytes,
        chunksWritten,
        totalChunks: manifest.totalChunks,
        status: manifest.status,
        fraction: manifest.totalBytes ? Math.min(1, downloadedBytes / manifest.totalBytes) : 0,
      };
    } catch {
      return empty;
    }
  }

  /**
   * Starts (or resumes) the model download. Streaming is progressive: each
   * chunk is committed to IndexedDB the moment it arrives, and on resume a
   * Range header skips bytes already stored. Resolves when complete.
   */
  async download(
    modelId: string,
    url: string,
    totalBytes: number,
  ): Promise<ModelDownloadProgress | null> {
    const db = this.getDb();
    if (!db || this.downloadPromise) return this.downloadPromise;

    this.downloadPromise = this.runDownload(db, modelId, url, totalBytes).finally(() => {
      this.downloadPromise = null;
      this.abort = null;
    });
    return this.downloadPromise;
  }

  private async runDownload(
    db: DisasterLinkDB,
    modelId: string,
    url: string,
    totalBytes: number,
  ): Promise<ModelDownloadProgress | null> {
    let manifest = await this.readManifest(db);
    const existingChunks = manifest?.modelId === modelId ? await db.gemmaModel.count() : 0;

    if (!manifest || manifest.modelId !== modelId || manifest.status === "complete") {
      manifest = {
        version: 1,
        modelId,
        totalBytes,
        chunkSize: this.chunkSize,
        totalChunks: Math.ceil(totalBytes / this.chunkSize),
        lastChunkIndex: -1,
        status: "downloading",
        baseUrl: url,
        updatedAt: new Date().toISOString(),
      };
      await this.writeManifest(db, manifest);
    } else {
      manifest = { ...manifest, status: "downloading", updatedAt: new Date().toISOString() };
      await this.writeManifest(db, manifest);
    }

    this.abort = new AbortController();
    emit(MODEL_EVENT_STATE, { modelId, status: "downloading" });

    const startByte = existingChunks * this.chunkSize;
    const headers: Record<string, string> = {};
    if (startByte > 0) headers["Range"] = `bytes=${startByte}-`;
    // Unknown-length bodies (no Content-Length) fall back to the manifest size.

    try {
      const response = await this.fetchFn(url, {
        signal: this.abort.signal,
        headers,
        cache: "no-store",
      });
      if (!response.ok && response.status !== 206) {
        throw new Error(`Model download failed: HTTP ${response.status}`);
      }
      const contentLength = response.headers.get("content-length");
      const realTotal = contentLength
        ? Number(contentLength) + startByte
        : totalBytes;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Model download failed: no response body");

      const buffer = new Uint8Array(this.chunkSize);
      let offset = 0;
      let chunkIndex = existingChunks;
      let written = existingChunks;

      // If the server ignored the Range header (200 instead of 206), the
      // body starts at byte 0 and we must skip the already-stored bytes.
      const skipped = startByte > 0 && response.status === 200;
      let skipRemaining = skipped ? startByte : 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let view = value;
        if (skipRemaining > 0) {
          if (view.length <= skipRemaining) {
            skipRemaining -= view.length;
            continue;
          }
          view = view.slice(skipRemaining);
          skipRemaining = 0;
        }
        for (let i = 0; i < view.length; i++) {
          buffer[offset++] = view[i];
          if (offset === this.chunkSize) {
            await db.gemmaModel.put({
              id: chunkIndex,
              chunkIndex,
              totalChunks: manifest.totalChunks,
              bytes: new Blob([buffer.slice(0, offset)]),
              downloadedAt: new Date().toISOString(),
            });
            chunkIndex += 1;
            written += 1;
            offset = 0;
            await this.writeManifest(db, {
              ...manifest,
              lastChunkIndex: chunkIndex - 1,
              status: "downloading",
              updatedAt: new Date().toISOString(),
            });
            emit(MODEL_EVENT, {
              modelId,
              downloadedBytes: written * this.chunkSize,
              totalBytes: realTotal,
              chunksWritten: written,
              totalChunks: manifest.totalChunks,
            });
          }
        }
      }

      // Flush the final partial chunk.
      if (offset > 0) {
        await db.gemmaModel.put({
          id: chunkIndex,
          chunkIndex,
          totalChunks: manifest.totalChunks,
          bytes: new Blob([buffer.slice(0, offset)]),
          downloadedAt: new Date().toISOString(),
        });
        written += 1;
        await this.writeManifest(db, {
          ...manifest,
          lastChunkIndex: chunkIndex,
          status: "downloading",
          updatedAt: new Date().toISOString(),
        });
      }

      const finalManifest: ModelManifest = {
        ...manifest,
        status: "complete",
        updatedAt: new Date().toISOString(),
      };
      await this.writeManifest(db, finalManifest);
      emit(MODEL_EVENT_STATE, { modelId, status: "complete" });

      const progress: ModelDownloadProgress = {
        modelId,
        downloadedBytes: realTotal,
        totalBytes: realTotal,
        chunksWritten: written,
        totalChunks: manifest.totalChunks,
        status: "complete",
        fraction: 1,
      };
      return progress;
    } catch (error: unknown) {
      if (this.abort?.signal.aborted) {
        const paused: ModelManifest = { ...manifest, status: "paused", updatedAt: new Date().toISOString() };
        await this.writeManifest(db, paused);
        emit(MODEL_EVENT_STATE, { modelId, status: "paused" });
        return this.getState(modelId);
      }
      await this.writeManifest(db, {
        ...manifest,
        status: "error",
        updatedAt: new Date().toISOString(),
      });
      emit(MODEL_EVENT_STATE, { modelId, status: "error" });
      throw error;
    }
  }

  /** Aborts the in-flight download; state becomes "paused". */
  async pause(): Promise<void> {
    if (this.abort) this.abort.abort();
  }

  /** True while a download stream is active. */
  get active(): boolean {
    return !!this.downloadPromise;
  }

  /** Removes every model chunk + the manifest (frees ~1.3 GB). */
  async deleteModel(modelId: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;
    this.pause();
    try {
      const manifest = await this.readManifest(db);
      if (manifest?.modelId === modelId) await db.metadata.delete(MANIFEST_KEY);
      await db.gemmaModel.clear();
    } catch {
      // ignore
    }
  }
}

/** App-wide singleton the Storage Manager UI routes to. */
let sharedStore: ModelChunkStore | null = null;

export function getModelStore(): ModelChunkStore {
  if (!sharedStore) sharedStore = new ModelChunkStore();
  return sharedStore;
}
