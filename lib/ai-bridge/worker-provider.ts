"use client";

// ---------------------------------------------------------------------
// lib/ai-bridge/worker-provider.ts — Offline-First Architecture · Phase 10
// WorkerLLMProvider: runs local inference on a dedicated Web Worker (see
// ai.worker.ts) so Gemma token generation never blocks the UI thread.
//
// Implements the shared AIProvider contract (generateResponse,
// streamResponse, loadModel, getStatus) with an async message protocol.
// It degrades to the main-thread WebLLMProvider when Workers are
// unavailable (SSR, some embedded browsers) so the chat never breaks.
//
// Construction is injectable for tests: pass `createWorker` to stub the
// worker with an in-memory fake that speaks the same message protocol.
// ---------------------------------------------------------------------

import { WebLLMProvider } from "./webllm-provider";
import type { AIProvider, AIResponse, ChatContext, ProviderStatus } from "./types";

/** Message shapes the client sends to the worker. */
export type WorkerRequest =
  | { type: "init"; id: number; modelId: string }
  | { type: "generate"; id: number; prompt: string; context: { currentDistrict?: string; history?: Array<{ role: string; content: string }> } }
  | { type: "stream"; id: number; prompt: string; context: { currentDistrict?: string; history?: Array<{ role: string; content: string }> } }
  | { type: "unload"; id: number };

/** Distributes Omit across a union (plain Omit collapses unions). */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type WorkerRequestWithoutId = DistributiveOmit<WorkerRequest, "id">;

export type WorkerResponse =
  | { type: "progress"; id: number; progress: number }
  | { type: "init-done"; id: number; ok: boolean }
  | { type: "chunk"; id: number; text: string }
  | { type: "done"; id: number; text: string; durationMs: number; error?: string }
  | { type: "unloaded"; id: number };

/** Creates a worker from the bundled ai.worker.ts (main-thread helper). */
function defaultCreateWorker(): Worker | null {
  if (typeof Worker === "undefined") return null;
  try {
    // Next.js bundles `new URL(..., import.meta.url)` workers as separate
    // chunks; this is the documented webpack-5 way to spawn one.
    return new Worker(new URL("./ai.worker.ts", import.meta.url), { type: "module" });
  } catch {
    return null;
  }
}

export interface WorkerLLMProviderOptions {
  modelId?: string;
  createWorker?: () => Worker | null;
}

export class WorkerLLMProvider implements AIProvider {
  private readonly modelId: string;
  private readonly createWorker: () => Worker | null;
  private readonly fallback: WebLLMProvider;
  private worker: Worker | null = null;
  private status: ProviderStatus = "local-unavailable";
  private sequence = 0;
  /** Pending one-shot request resolvers keyed by message id. */
  private pending = new Map<number, (m: WorkerResponse) => void>();
  /** Streaming channels: accumulate chunk messages until the done message. */
  private streams = new Map<number, (m: WorkerResponse) => void>();

  constructor(options: WorkerLLMProviderOptions = {}) {
    this.modelId = options.modelId ?? "gemma-2b-it-q4f16_1-MLC";
    this.createWorker = options.createWorker ?? defaultCreateWorker;
    this.fallback = new WebLLMProvider();
  }

  private ensureWorker(): Worker | null {
    if (this.worker) return this.worker;
    const w = this.createWorker();
    if (!w) return null;
    this.worker = w;
    w.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      const resolver = this.pending.get(message.id);
      if (resolver) {
        this.pending.delete(message.id);
        resolver(message);
        return;
      }
      const stream = this.streams.get(message.id);
      if (stream) {
        stream(message);
      }
    });
    return this.worker;
  }

  private request(message: WorkerRequestWithoutId): Promise<WorkerResponse> {
    const worker = this.ensureWorker();
    if (!worker) return Promise.reject(new Error("worker unavailable"));
    const id = ++this.sequence;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      worker.postMessage({ ...message, id } as WorkerRequest);
    });
  }

  /**
   * Multi-message request: the worker may answer a `stream` request with any
   * number of `chunk` messages followed by a final `done`. Yields each message
   * until the terminal one arrives.
   */
  private async *streamRequest(message: WorkerRequestWithoutId): AsyncGenerator<WorkerResponse> {
    const worker = this.ensureWorker();
    if (!worker) throw new Error("worker unavailable");
    const id = ++this.sequence;
    const queue: WorkerResponse[] = [];
    const waiters: Array<(m: WorkerResponse) => void> = [];
    this.streams.set(id, (m) => {
      const waiter = waiters.shift();
      if (waiter) waiter(m);
      else queue.push(m);
    });
    worker.postMessage({ ...message, id } as WorkerRequest);
    try {
      for (;;) {
        const next = queue.shift();
        if (!next) {
          yield await new Promise<WorkerResponse>((resolve) => waiters.push(resolve));
        } else {
          yield next;
        }
        if (next?.type === "done" || next?.type === "unloaded") break;
      }
    } finally {
      this.streams.delete(id);
    }
  }

  /** True when this browser can actually spawn a worker for inference. */
  isWorkerSupported(): boolean {
    return this.ensureWorker() !== null;
  }

  getStatus(): ProviderStatus {
    if (this.worker && this.status === "local-ready") return "local-ready";
    // Fall back to the main-thread status so the bridge badge stays honest.
    return this.fallback.getStatus();
  }

  /** Lazy model load: init the worker engine on demand (Phase 10 spec). */
  async loadModel(): Promise<boolean> {
    if (!this.ensureWorker()) return this.fallback.loadModel();
    this.status = "local-loading";
    try {
      const res = await this.request({ type: "init", modelId: this.modelId });
      this.status = res.type === "init-done" && res.ok ? "local-ready" : "local-unavailable";
      return res.type === "init-done" && res.ok;
    } catch {
      this.status = "local-unavailable";
      return false;
    }
  }

  async generateResponse(prompt: string, context: ChatContext): Promise<AIResponse> {
    if (!this.ensureWorker()) return this.fallback.generateResponse(prompt, context);
    const startedAt = Date.now();
    const res = await this.request({
      type: "generate",
      prompt,
      context: {
        currentDistrict: context.currentDistrict,
        history: (context.history ?? []).map((m) => ({ role: m.role, content: m.content })),
      },
    });
    if (res.type !== "done") {
      return { text: "Worker returned an unexpected response.", mode: "error", durationMs: 0, error: true };
    }
    if (res.error) {
      return { text: res.error, mode: "error", durationMs: res.durationMs, error: true };
    }
    return {
      text: res.text || "The local model returned an empty response.",
      mode: "local",
      durationMs: res.durationMs || Date.now() - startedAt,
      source: "web-worker",
    };
  }

  async *streamResponse(
    prompt: string,
    context: ChatContext,
  ): AsyncGenerator<{ text: string; done: boolean; mode: "local" | "error" }> {
    if (!this.ensureWorker()) {
      yield* this.fallback.streamResponse(prompt, context);
      return;
    }
    try {
      let streamed = false;
      for await (const res of this.streamRequest({
        type: "stream",
        prompt,
        context: {
          currentDistrict: context.currentDistrict,
          history: (context.history ?? []).map((m) => ({ role: m.role, content: m.content })),
        },
      })) {
        if (res.type === "chunk") {
          streamed = true;
          yield { text: res.text, done: false, mode: "local" };
        } else if (res.type === "done") {
          if (res.error) {
            yield { text: res.error, done: true, mode: "error" };
          } else {
            // Emit the full reply as one burst only when nothing streamed
            // (chunk messages already carry the text piece-by-piece).
            if (res.text && !streamed) yield { text: res.text, done: false, mode: "local" };
            yield { text: "", done: true, mode: "local" };
          }
          return;
        }
      }
    } catch {
      yield { text: "Worker streaming failed.", done: true, mode: "error" };
    }
  }

  estimateTokens(text: string): number {
    return this.fallback.estimateTokens(text);
  }

  /** Unloads the model from RAM when the app is backgrounded (Phase 10). */
  async unloadModel(): Promise<void> {
    if (!this.worker) return;
    try {
      await this.request({ type: "unload" });
    } catch {
      // worker gone — nothing to unload
    }
    this.status = "local-unavailable";
  }
}

export default WorkerLLMProvider;
