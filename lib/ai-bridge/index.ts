// ---------------------------------------------------------------------
// lib/ai-bridge/index.ts — Offline-First Architecture · Phase 1
// Barrel for the AI Bridge layer. Chat UIs import the hook
// (hooks/useAI.ts) and, when they need the primitives, this module:
//   import { AIBridge, getAIBridge, CloudAIProvider, estimateTokens } from "@/lib/ai-bridge";
// ---------------------------------------------------------------------

export { AIBridge, getAIBridge } from "./ai-bridge";
export type { AIBridgeOptions } from "./ai-bridge";
export { CloudAIProvider, DEFAULT_CHAT_ENDPOINT } from "./cloud-provider";
export { LocalGemmaProvider, DEFAULT_GEMMA_MODEL } from "./local-provider";
export {
  WebLLMProvider,
  DISASTER_SYSTEM_PROMPT,
  DEFAULT_WEBLLM_MODEL,
} from "./webllm-provider";
export type { WebLLMProviderOptions } from "./webllm-provider";
export { ConnectivityMonitor, getConnectivityMonitor } from "./connectivity";
export type {
  ConnectivitySnapshot,
  ConnectivityListener,
} from "./connectivity";
export { estimateTokens } from "./estimate-tokens";
export type {
  AIProvider,
  AIResponse,
  BridgeMode,
  ChatContext,
  ChatMessage,
  ProviderStatus,
} from "./types";