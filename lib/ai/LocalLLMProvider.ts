"use client";

// ---------------------------------------------------------------------
// lib/ai/LocalLLMProvider.ts — Local AI (WebLLM / WebGPU) adapter.
//
// Thin convenience layer over the existing WebLLMProvider
// (lib/ai-bridge/webllm-provider.ts) exposing the offline-AI API used by
// the field surfaces:
//
//   • initializeModel(onProgress) — downloads (or loads from WebLLM's
//     browser cache) the quantized model weights, streaming 0→100%
//     download progress to the callback.
//   • generateLocalResponse(prompt, contextData) — injects the offline
//     Dexie context (predictions / alerts / shelters / resources rows)
//     into the user's prompt and runs inference entirely in-browser via
//     WebGPU/WASM, no network.
//
// The engine is shared with the rest of the app (same MLCEngine instance
// from lib/ai-bridge), so a model warmed up by the Settings · Storage
// flow is reused here. @mlc-ai/web-llm is installed (^0.2.84); the lazy
// import stays defensive — a blocked module degrades to the guided
// "local model isn't ready" reply instead of breaking the build
// (see webllm-provider.ts).
// ---------------------------------------------------------------------

import {
  WebLLMProvider,
  DISASTER_SYSTEM_PROMPT,
} from "@/lib/ai-bridge/webllm-provider";
import type { AIResponse } from "@/lib/ai-bridge/types";

/** Quantized Gemma 2B model id (WebLLM supported list). TinyLlama
 * (tinyllama-1.1b-chat-v1.0-q4f16_1-MLC) and other small ids work too —
 * pass one via the `modelId` option. */
export const DEFAULT_LOCAL_MODEL = "gemma-2b-it-q4f32_1-MLC";

/** Max characters of serialized Dexie context injected per prompt. */
const MAX_CONTEXT_CHARS = 6_000;

export interface LocalLLMOptions {
  /** WebLLM model id — default gemma-2b-it-q4f32_1-MLC. */
  modelId?: string;
}

/** A shape with the engine's row fields (OfflineRecord<unknown>). */
interface ContextRow {
  id?: unknown;
  district?: unknown;
  data?: unknown;
  cachedAt?: unknown;
  expiresAt?: unknown;
}

/** Compact, deterministic serialization of the offline Dexie rows. */
function serializeContext(contextData: unknown): string {
  if (contextData === null || contextData === undefined) return "";
  if (typeof contextData === "string") return contextData.slice(0, MAX_CONTEXT_CHARS);

  const rows = Array.isArray(contextData) ? contextData : [contextData];
  const parts = rows.map((row, index) => {
    const r = (row ?? {}) as ContextRow;
    // OfflineRecord rows — surface the payload (data) with its district.
    if (r && typeof r === "object" && "data" in r) {
      const label = r.district ? `[${String(r.district)}]` : `[row ${index}]`;
      try {
        return `${label} ${JSON.stringify(r.data ?? {})}`;
      } catch {
        return `${label} ${String(r.data)}`;
      }
    }
    // Anything else — plain JSON.
    try {
      return JSON.stringify(row);
    } catch {
      return String(row);
    }
  });

  const joined = parts.join("\n");
  return joined.length > MAX_CONTEXT_CHARS
    ? joined.slice(0, MAX_CONTEXT_CHARS)
    : joined;
}

export class LocalLLMProvider {
  private readonly provider: WebLLMProvider;
  private readonly modelId: string;

  constructor(options: LocalLLMOptions = {}) {
    this.modelId = options.modelId ?? DEFAULT_LOCAL_MODEL;
    this.provider = new WebLLMProvider({ modelId: this.modelId });
  }

  /** The configured WebLLM model id. */
  get model(): string {
    return this.modelId;
  }

  /** True once the weights are loaded and in-browser inference is possible. */
  get isReady(): boolean {
    return this.provider.isModelLoaded();
  }

  /**
   * Downloads the quantized model weights into the browser cache (or loads
   * them if already cached), streaming progress 0→1 to `onProgress`.
   * Resolves true when the engine is ready for inference.
   */
  async initializeModel(onProgress: (fraction: number) => void): Promise<boolean> {
    return this.provider.initialize(onProgress);
  }

  /**
   * Runs a fully offline inference: injects `contextData` (the offline
   * Dexie rows — predictions, alerts, shelters, resources) into the
   * prompt and returns the model's reply. Never touches the network.
   */
  async generateLocalResponse(
    prompt: string,
    contextData: unknown,
  ): Promise<AIResponse> {
    const context = serializeContext(contextData);
    const fullPrompt = context
      ? `${prompt}\n\n--- Offline context (cached disaster data) ---\n${context}`
      : prompt;

    return this.provider.generateResponse(fullPrompt, { history: [] });
  }
}

/** App-wide singleton so one warm model is shared across surfaces. */
let sharedLocalLLM: LocalLLMProvider | null = null;

export function getLocalLLMProvider(): LocalLLMProvider {
  if (!sharedLocalLLM) sharedLocalLLM = new LocalLLMProvider();
  return sharedLocalLLM;
}

export { DISASTER_SYSTEM_PROMPT };

export default LocalLLMProvider;
