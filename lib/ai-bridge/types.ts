// ---------------------------------------------------------------------
// lib/ai-bridge/types.ts — Offline-First Architecture · Phase 1
// The AI Bridge pattern: the foundational abstraction that lets the
// chatbot switch between cloud AI and the local Gemma model without the
// UI knowing the difference.
//
// Both providers (lib/ai-bridge/cloud-provider.ts and
// lib/ai-bridge/local-provider.ts) implement the single `AIProvider`
// interface below. lib/ai-bridge/ai-bridge.ts routes between them based
// on connectivity (navigator.onLine + heartbeat ping to Supabase).
// ---------------------------------------------------------------------

/** How an AI provider reports its readiness to the bridge. */
export type ProviderStatus =
  | "online" // cloud path healthy (browser is online + backend pinged)
  | "offline" // browser is offline — cloud path unavailable
  | "local-ready" // Gemma model is loaded in WebLLM, can answer offline
  | "local-loading" // model download / warm-up in progress
  | "local-unavailable"; // WebLLM/model not present on this device

/** What actually produced the returned text. */
export type BridgeMode = "cloud" | "local" | "error";

/** Minimal chat message shape shared by the bridge and the chat UI. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Extra routing/context hints the UI can attach to a prompt. */
export interface ChatContext {
  /** Currently-viewed district (sent to the cloud planner as hidden context). */
  currentDistrict?: string;
  /** Provider preference from Settings · AI (e.g. 'groq-llama3'). */
  provider?: string;
  /** Prior conversation turns for multi-turn follow-ups. */
  history?: ChatMessage[];
}

/** The unified result every provider must return. */
export interface AIResponse {
  text: string;
  mode: BridgeMode;
  /** ms spent generating (cloud round-trip or local inference). */
  durationMs: number;
  /** True when text is an error/offline notice rather than an answer. */
  error?: boolean;
}

/**
 * The single interface implemented by CloudAIProvider and LocalGemmaProvider.
 * `route()` in lib/ai-bridge/ai-bridge.ts only ever talks to this contract,
 * so the chat UI never needs to know which backend answered.
 */
export interface AIProvider {
  generateResponse(prompt: string, context: ChatContext): Promise<AIResponse>;
  getStatus(): ProviderStatus;
  estimateTokens(text: string): number;
  /**
   * Kicks off a percentage of the provider's readiness work (e.g. local
   * model download) without generating text. Resolves true once ready.
   * Optional — cloud providers have nothing to preload.
   */
  loadModel?(): Promise<boolean>;
}
