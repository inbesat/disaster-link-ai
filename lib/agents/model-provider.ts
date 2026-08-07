import { ChatOpenAI } from "@langchain/openai";
import type { Runnable } from "@langchain/core/runnables";

// ---------------------------------------------------------------------
// lib/agents/model-provider.ts
// Routes multi-agent LLM calls across every configured OpenAI-compatible
// provider so the graph keeps working even when one vendor is down or
// rate-limited. Order: OpenRouter (Claude) → Groq (Llama 3.3) → Bluesminds
// (GPT-4o). Each provider respects its own primary + backup API key.
// ---------------------------------------------------------------------

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const GROQ_BASE = "https://api.groq.com/openai/v1";
const BLUESMINDS_BASE = "https://api.bluesminds.com/v1";

const OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const BLUESMINDS_MODEL = "openai/gpt-4o";

function pick(primary: string | undefined, backup: string | undefined): string | undefined {
  return primary && primary.length > 8 ? primary : backup;
}

function openRouterModel(): ChatOpenAI {
  const key = pick(process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_API_KEY_BACKUP);
  void key;
  return new ChatOpenAI({
    model: OPENROUTER_MODEL,
    apiKey: key ?? "missing-openrouter-key",
    configuration: { baseURL: OPENROUTER_BASE },
    temperature: 0.4,
  });
}

function backendModel(
  apiKey: string | undefined,
  baseURL: string,
  model: string,
): ChatOpenAI | null {
  if (!apiKey) return null;
  return new ChatOpenAI({
    model,
    apiKey,
    configuration: { baseURL },
    temperature: 0.4,
  });
}

/**
 * Returns the primary planner model (OpenRouter → Claude 3.5 Sonnet) with an
 * automatic fallback chain (Groq → Bluesminds) already attached, so a single
 * `model.invoke(...)` transparently steps down when the primary is unavailable.
 */
export function getAgentModel(): Runnable {
  const model = openRouterModel();
  const fallbacks = [
    backendModel(
      pick(process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_BACKUP),
      GROQ_BASE,
      GROQ_MODEL,
    ),
    backendModel(process.env.BLUESMINDS_API_KEY, BLUESMINDS_BASE, BLUESMINDS_MODEL),
  ].filter(Boolean) as ChatOpenAI[];
  if (fallbacks.length) {
    return model.withFallbacks(fallbacks);
  }
  return model;
}