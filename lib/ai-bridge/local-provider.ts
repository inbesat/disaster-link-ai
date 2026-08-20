"use client";

// ---------------------------------------------------------------------
// lib/ai-bridge/local-provider.ts — Offline-First Architecture · Phase 1
// LocalGemmaProvider: the offline path of the AI Bridge. Runs a small
// Gemma model (gemma-2b / gemma-27b) directly in the browser via the
// @mlc-ai/web-llm WebGPU/WASM engine, so emergency planning keeps
// working in field blackouts with no connectivity at all.
//
// Deliberately resilient when WebLLM is NOT installed yet (Phase 2 wires
// in the actual 4-bit model download + warm-up):
//   - the engine is imported lazily via dynamic `import()` so a missing
//     package can never break the client build or the cloud path;
//   - every position where a real inference would run detects the absent
//     engine and degrades to the guided "local AI not ready" reply;
//   - status stays truthful: 'local-loading' during warm-up, 'local-ready'
//     once the engine reports a loaded model, 'local-unavailable' when the
//     runtime has no WebGPU/WebLLM support (e.g. SSR node).
// ---------------------------------------------------------------------

import type { AIProvider, AIResponse, ChatContext, ProviderStatus } from "./types";
import { estimateTokens } from "./estimate-tokens";

/** 4-bit quantized Gemma model id recognized by newer WebLLM builds. */
export const DEFAULT_GEMMA_MODEL = "gemma-2b-it-q4f16_1";

/** Guided reply when offline but the local model isn't available yet. */
const OFFLINE_NOT_READY =
  "I'm offline and the local safety model isn't ready yet. " +
  "Please reconnect to the internet so the model can be downloaded to this device.";

interface LocalGemmaProviderOptions {
  /** Model id passed to the WebLLM engine. */
  modelId?: string;
  /** Lazy loader override (tests / phase-2 wiring). */
  loadEngine?: () => Promise<unknown>;
  /** Force the engine to report available — used by the simulator/tests. */
  engineAvailable?: boolean;
}

/**
 * Minimal structural view of the WebLLM engine we depend on. Kept local so
 * the module has zero hard dependency on @mlc-ai/web-llm typings.
 */
interface WebLlmEngineLike {
  loadedModel?: string;
  chat?: {
    completions?: {
      create: (opts: {
        messages: Array<{ role: string; content: string }>;
        temperature?: number;
      }) => Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
    };
  };
}

export class LocalGemmaProvider implements AIProvider {  private engine: WebLlmEngineLike | null = null;
  private enginePromise: Promise<WebLlmEngineLike | null> | null = null;
  private status: ProviderStatus = "local-unavailable";
  private readonly modelId: string;
  private readonly loadEngine: () => Promise<unknown>;

  constructor(options: LocalGemmaProviderOptions = {}) {
    this.modelId = options.modelId ?? DEFAULT_GEMMA_MODEL;
    this.loadEngine = options.loadEngine ?? defaultLoadEngine(this.modelId);

    if (options.engineAvailable) {
      this.status = "local-ready";
    }
  }

  getStatus(): ProviderStatus {
    if (this.engine) return "local-ready";
    return this.status;
  }

  /**
   * Kicks off the lazy model load once (deduped). Resolves to the engine on
   * success and `null` when WebLLM isn't present / the runtime can't run it.
   */
  async loadModel(): Promise<boolean> {
    if (this.engine) return true;
    if (!this.enginePromise) {
      this.status = "local-loading";
      this.enginePromise =
        Promise.resolve()
          .then(() => this.loadEngine())
          .then((engine) => {
            this.engine = engine as WebLlmEngineLike | null;
            this.status =
              this.engine && hasChat(this.engine) ? "local-ready" : "local-unavailable";
            return this.engine;
          })
          .catch(() => {
            this.status = "local-unavailable";
            return null;
          });
    }
    await this.enginePromise;
    return this.engine !== null;
  }

  async generateResponse(
    prompt: string,
    context: ChatContext,
  ): Promise<AIResponse> {
    const startedAt = Date.now();

    if (this.engine && hasChat(this.engine)) {
      try {
        const create = this.engine.chat!.completions!.create.bind(this.engine.chat!.completions!);
        const result = await create({
          messages: [
            ...(context.history ?? []).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: prompt },
          ],
          temperature: 0.4,
        });
        const text = result.choices?.[0]?.message?.content?.trim();
        return {
          text:
            text || "The local model returned an empty response. Try rephrasing, or reconnect for the cloud planner.",
          mode: "local",
          durationMs: Date.now() - startedAt,
        };
      } catch (error: unknown) {
        return {
          text:
            error instanceof Error
              ? `Local model inference failed: ${error.message}`
              : "Local model inference failed.",
          mode: "error",
          durationMs: Date.now() - startedAt,
          error: true,
        };
      }
    }

    // Model not loaded: try a warm-up in case it finished since construction.
    if (this.status === "local-loading") {
      const loaded = await this.loadModel();
      if (loaded) return this.generateResponse(prompt, context);
    }

    return {
      text: OFFLINE_NOT_READY,
      mode: "error",
      durationMs: Date.now() - startedAt,
      error: true,
    };
  }

  estimateTokens(text: string): number {
    return estimateTokens(text);
  }
}

function hasChat(engine: WebLlmEngineLike): engine is WebLlmEngineLike {
  return !!engine.chat?.completions?.create;
}

/** Lazy importer — unresolved optional dependency degrades to `null`. */
function defaultLoadEngine(modelId: string): () => Promise<unknown> {
  return () =>
    import("@mlc-ai/web-llm").then(
      (mod: unknown) => {
        const m = mod as { CreateMLCEngine?: (...args: unknown[]) => Promise<object>; MLCEngine?: new (...args: unknown[]) => object };
        // Newer API: CreateMLCEngine(modelId, config) → engine instance.
        if (typeof m.CreateMLCEngine === "function") {
          return m.CreateMLCEngine(modelId, { initProgressCallback: () => {} }) as Promise<unknown>;
        }
        // Older API: new MLCEngine() then engine.reload(modelId).
        if (typeof m.MLCEngine === "function") {
          return new m.MLCEngine(modelId) as unknown;
        }
        return null;
      },
      () => null, // module not installed / blocked — offline fallback stays.
    );
}