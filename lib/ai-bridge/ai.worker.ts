// ---------------------------------------------------------------------
// lib/ai-bridge/ai.worker.ts — Offline-First Architecture · Phase 10
// Web Worker wrapper for WebLLM: runs the Gemma/TinyLlama/Phi-2 inference
// engine off the main thread so token generation never freezes the UI.
//
// Protocol (structured-clone JSON messages):
//   main → worker
//     { type: "init",   id, modelId }              load the model weights
//     { type: "generate", id, prompt, context }    full non-streaming reply
//     { type: "stream",  id, prompt, context }     token-by-token reply
//     { type: "unload",  id }                      free the model from RAM
//   worker → main
//     { type: "progress", id, progress }           0..1 download progress
//     { type: "init-done", id, ok }
//     { type: "chunk", id, text }                  one streamed token batch
//     { type: "done", id, text, durationMs, error? }  reply finished
//     { type: "unloaded", id }
//
// The engine is created lazily inside the worker (dynamic import of
// @mlc-ai/web-llm), so a browser that blocks the module still gets a clean
// error reply instead of a dead worker. Everything is `self.postMessage`-based
// — no DOM access, which is exactly what keeps the main thread responsive.
// ---------------------------------------------------------------------

import { DISASTER_SYSTEM_PROMPT, DEFAULT_WEBLLM_MODEL } from "./webllm-provider";

/** Minimal engine shape the worker needs (mirrors WebLlmEngineLike). */
interface WorkerEngine {
  chatCompletions?: {
    create: (opts: {
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
    }) => AsyncGenerator<{ choices?: Array<{ delta?: { content?: string } }> }>;
  };
  chat?: {
    completions?: {
      create: (opts: {
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
      }) => Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
    };
  };
}

type WorkerContext = {
  currentDistrict?: string;
  history?: Array<{ role: string; content: string }>;
};

type WorkerMessage =
  | { type: "init"; id: number; modelId: string }
  | { type: "generate"; id: number; prompt: string; context: WorkerContext }
  | { type: "stream"; id: number; prompt: string; context: WorkerContext }
  | { type: "unload"; id: number };

const post = (message: Record<string, unknown>): void => {
  (self as unknown as { postMessage(m: unknown): void }).postMessage(message);
};

let engine: WorkerEngine | null = null;
let enginePromise: Promise<WorkerEngine | null> | null = null;
let activeModelId: string | null = null;

/** Lazily creates the engine inside the worker (one shared instance). */
function getEngine(modelId: string): Promise<WorkerEngine | null> {
  if (engine) return Promise.resolve(engine);
  if (!enginePromise) {
    enginePromise = import("@mlc-ai/web-llm")
      .then((mod: unknown) => {
        const m = mod as {
          CreateMLCEngine?: (id: string, config: { initProgressCallback?: (r: { progress: number }) => void }) => Promise<WorkerEngine>;
          MLCEngine?: new (id?: string, config?: { initProgressCallback?: (r: { progress: number }) => void }) => WorkerEngine;
        };
        if (typeof m.CreateMLCEngine === "function") {
          return m.CreateMLCEngine(modelId, {
            initProgressCallback: (report) => post({ type: "progress", progress: report.progress }),
          });
        }
        if (typeof m.MLCEngine === "function") {
          return new m.MLCEngine(modelId) as WorkerEngine;
        }
        return null;
      })
      .then((result) => {
        engine = result && (hasStreaming(result) || hasChat(result)) ? result : null;
        activeModelId = engine ? modelId : null;
        return engine;
      })
      .catch(() => null);
  }
  return enginePromise;
}

function hasStreaming(e: WorkerEngine): boolean {
  return typeof e.chatCompletions?.create === "function";
}

function hasChat(e: WorkerEngine): boolean {
  return typeof e.chat?.completions?.create === "function";
}

function buildMessages(prompt: string, context: WorkerContext): Array<{ role: string; content: string }> {
  return [
    { role: "system", content: DISASTER_SYSTEM_PROMPT },
    ...(context.history ?? []),
    { role: "user", content: prompt },
  ];
}

/** Handles one incoming message and posts the reply. */
async function handle(message: WorkerMessage): Promise<void> {
  switch (message.type) {
    case "init": {
      const result = await getEngine(message.modelId);
      post({ type: "init-done", id: message.id, ok: result !== null });
      return;
    }
    case "generate": {
      const startedAt = Date.now();
      const result = await getEngine(activeModelId ?? DEFAULT_WEBLLM_MODEL);
      if (!result || !hasChat(result)) {
        post({ type: "done", id: message.id, text: "", durationMs: 0, error: "worker: model not loaded" });
        return;
      }
      try {
        const create = result.chat!.completions!.create.bind(result.chat!.completions!);
        const reply = await create({
          messages: buildMessages(message.prompt, message.context),
          temperature: 0.4,
        });
        const text = reply.choices?.[0]?.message?.content?.trim() ?? "";
        post({ type: "done", id: message.id, text, durationMs: Date.now() - startedAt });
      } catch (cause) {
        post({
          type: "done",
          id: message.id,
          text: "",
          durationMs: Date.now() - startedAt,
          error: cause instanceof Error ? cause.message : "worker: inference failed",
        });
      }
      return;
    }
    case "stream": {
      const startedAt = Date.now();
      const result = await getEngine(activeModelId ?? DEFAULT_WEBLLM_MODEL);
      if (!result || !hasStreaming(result)) {
        post({ type: "done", id: message.id, text: "", durationMs: 0, error: "worker: streaming unavailable" });
        return;
      }
      try {
        const generator = result.chatCompletions!.create({
          messages: buildMessages(message.prompt, message.context),
          temperature: 0.4,
        });
        let full = "";
        for await (const chunk of generator) {
          const delta = chunk.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            post({ type: "chunk", id: message.id, text: delta });
          }
        }
        post({ type: "done", id: message.id, text: full, durationMs: Date.now() - startedAt });
      } catch (cause) {
        post({
          type: "done",
          id: message.id,
          text: "",
          durationMs: Date.now() - startedAt,
          error: cause instanceof Error ? cause.message : "worker: stream failed",
        });
      }
      return;
    }
    case "unload": {
      engine = null;
      enginePromise = null;
      activeModelId = null;
      post({ type: "unloaded", id: message.id });
      return;
    }
  }
}

// Wire the message listener only when running inside a worker context
// (self !== window). This module is also imported (types-only) by the
// client provider on the main thread, so the guard is essential.
if (typeof self !== "undefined" && typeof self.postMessage === "function") {
  self.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
    void handle(event.data);
  });
}

export {};
