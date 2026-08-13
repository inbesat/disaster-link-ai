// ---------------------------------------------------------------------
// lib/ai-bridge/worker-provider.test.ts — Phase 10 worker wrapper
// Exercises WorkerLLMProvider against an in-memory fake worker that speaks
// the exact ai.worker.ts message protocol (init/generate/stream/unload).
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { WorkerLLMProvider, type WorkerResponse } from "./worker-provider";
import type { ChatContext } from "./types";

interface MessageListener {
  (event: { data: unknown }): void;
}

/** Stands in for a real Worker; the harness injects replies. */
class FakeWorker {
  listeners = new Map<string, MessageListener[]>();
  sent: Array<{ type: string; id: number } & Record<string, unknown>> = [];
  terminated = false;

  addEventListener(type: string, cb: MessageListener): void {
    const list = this.listeners.get(type) ?? [];
    list.push(cb);
    this.listeners.set(type, list);
  }

  postMessage(message: { type: string; id: number } & Record<string, unknown>): void {
    this.sent.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Last request id the worker received for a given type. */
  lastId(type: string): number | undefined {
    return [...this.sent].reverse().find((m) => m.type === type)?.id;
  }

  /** Inject a response as if the real worker posted it. */
  emit(message: WorkerResponse): void {
    for (const cb of this.listeners.get("message") ?? []) {
      cb({ data: message });
    }
  }
}

const context: ChatContext = { currentDistrict: "Kerala Flood Zone A" };

describe("WorkerLLMProvider", () => {
  it("reports worker unsupported when none can be created", () => {
    const provider = new WorkerLLMProvider({ createWorker: () => null });
    expect(provider.isWorkerSupported()).toBe(false);
  });

  it("spawns a worker when createWorker returns one", () => {
    const provider = new WorkerLLMProvider({ createWorker: () => (new FakeWorker() as unknown as Worker) });
    expect(provider.isWorkerSupported()).toBe(true);
  });

  it("loadModel sends init and resolves true on init-done ok", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker), modelId: "phi-2" });
    const promise = provider.loadModel();
    const id = worker.lastId("init");
    expect(id).toBeTypeOf("number");
    worker.emit({ type: "init-done", id: id as number, ok: true });
    await expect(promise).resolves.toBe(true);
    expect(worker.sent[0]).toMatchObject({ type: "init", modelId: "phi-2" });
  });

  it("loadModel resolves false when the engine fails to init", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker) });
    const promise = provider.loadModel();
    worker.emit({ type: "init-done", id: worker.lastId("init") as number, ok: false });
    await expect(promise).resolves.toBe(false);
    expect(provider.getStatus()).toBe("local-unavailable");
  });

  it("generateResponse returns the done text with source web-worker", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker) });
    const promise = provider.generateResponse("Where is the relief camp?", context);
    worker.emit({
      type: "done",
      id: worker.lastId("generate") as number,
      text: "Go to the stadium. Bring ID.",
      durationMs: 1200,
    });
    const res = await promise;
    expect(res.mode).toBe("local");
    expect(res.text).toContain("stadium");
    expect(res.source).toBe("web-worker");
  });

  it("generateResponse surfaces worker errors", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker) });
    const promise = provider.generateResponse("hello", context);
    worker.emit({ type: "done", id: worker.lastId("generate") as number, text: "", durationMs: 0, error: "model not loaded" });
    const res = await promise;
    expect(res.error).toBe(true);
    expect(res.text).toContain("model not loaded");
  });

  it("streamResponse yields every chunk then the terminal done", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker) });
    const chunks: string[] = [];
    const done = (async () => {
      for await (const piece of provider.streamResponse("Tell me the plan", context)) {
        if (!piece.done) chunks.push(piece.text);
      }
    })();
    // Let the client post the stream request, then reply with chunks.
    await new Promise((r) => setTimeout(r, 0));
    const id = worker.lastId("stream") as number;
    worker.emit({ type: "chunk", id, text: "Move " });
    worker.emit({ type: "chunk", id, text: "to " });
    worker.emit({ type: "chunk", id, text: "higher ground." });
    worker.emit({ type: "done", id, text: "Move to higher ground.", durationMs: 800 });
    await done;
    expect(chunks.join("")).toBe("Move to higher ground.");
  });

  it("streamResponse reports an error for done-with-error", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker) });
    const out: Array<{ text: string; done: boolean; mode: string }> = [];
    const done = (async () => {
      for await (const piece of provider.streamResponse("x", context)) {
        out.push(piece);
      }
    })();
    await new Promise((r) => setTimeout(r, 0));
    const id = worker.lastId("stream") as number;
    worker.emit({ type: "done", id, text: "", durationMs: 0, error: "streaming unavailable" });
    await done;
    expect(out.at(-1)?.done).toBe(true);
    expect(out.at(-1)?.mode).toBe("error");
  });

  it("unloadModel posts unload and resets status", async () => {
    const worker = new FakeWorker();
    const provider = new WorkerLLMProvider({ createWorker: () => (worker as unknown as Worker) });
    const init = provider.loadModel();
    worker.emit({ type: "init-done", id: worker.lastId("init") as number, ok: true });
    await init;
    expect(provider.getStatus()).toBe("local-ready");

    const unloaded = provider.unloadModel();
    worker.emit({ type: "unloaded", id: worker.lastId("unload") as number });
    await unloaded;
    expect(provider.getStatus()).toBe("local-unavailable");
  });

  it("falls back to the main-thread provider when the worker is absent", async () => {
    const provider = new WorkerLLMProvider({ createWorker: () => null });
    expect(provider.isWorkerSupported()).toBe(false);
    const res = await provider.generateResponse("hello", context);
    // No engine loaded on the fallback either → a graceful error response.
    expect(res.error).toBe(true);
    expect(provider.estimateTokens("hello world")).toBeGreaterThan(0);
  });
});
