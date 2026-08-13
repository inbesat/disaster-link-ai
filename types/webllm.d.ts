// ---------------------------------------------------------------------
// types/webllm.d.ts — Offline-First Architecture · Phase 1
// Ambient typings for the OPTIONAL @mlc-ai/web-llm dependency used by
// lib/ai-bridge/local-provider.ts. WebLLM is not installed in this repo
// (Phase 2 wires the real 4-bit Gemma download/warm-up), so these loose
// typings keep the bridge type-checking while the package is absent.
// The runtime only ever touches these shapes after the lazy import().
// ---------------------------------------------------------------------

declare module "@mlc-ai/web-llm" {
  export interface MLCEngineConfig {
    initProgressCallback?: (report: { progress: number; text: string }) => void;
    logLevel?: "DEBUG" | "INFO" | "WARN" | "ERROR";
  }

  export class MLCEngine {
    constructor(modelId: string, config?: MLCEngineConfig);
    loadedModel?: string;
    reload(modelId: string): Promise<void>;
    chat: {
      completions: {
        create(opts: {
          messages: Array<{ role: string; content: string }>;
          temperature?: number;
          max_tokens?: number;
        }): Promise<{
          choices?: Array<{ message?: { content?: string } }>;
        }>;
      };
    };
  }

  export function CreateMLCEngine(
    modelId: string,
    config?: MLCEngineConfig,
  ): Promise<MLCEngine>;

  export function setPrebuiltAppConfig(config: unknown): void;
}
