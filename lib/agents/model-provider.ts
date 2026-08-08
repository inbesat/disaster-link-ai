import { ChatOpenAI } from "@langchain/openai";
import type { Runnable } from "@langchain/core/runnables";

// ---------------------------------------------------------------------
// lib/agents/model-provider.ts
// Routes multi-agent LLM calls across every configured OpenAI-compatible
// provider so the graph keeps working even when one vendor is down or
// rate-limited. Order: OpenRouter (both keys) → Groq (Llama 3.3) →
// Bluesminds. Each provider respects its own primary + backup API key.
// ---------------------------------------------------------------------

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const GROQ_BASE = "https://api.groq.com/openai/v1";
const BLUESMINDS_BASE = "https://api.bluesminds.com/v1";

// Live model ids — verified against each provider's /models endpoint
// (Aug 2026). `anthropic/claude-3.5-sonnet` and `openai/gpt-4o` were
// removed upstream and return 404/503 respectively.
const OPENROUTER_MODEL = "~anthropic/claude-sonnet-latest";
// gpt-oss-120b: reliable tool calling on Groq's free tier.
const GROQ_MODEL = "openai/gpt-oss-120b";
const BLUESMINDS_MODEL = "meta/llama-3.1-8b-instruct";

function hasKey(value: string | undefined): value is string {
  return Boolean(value && value.length > 8);
}

function openRouterModel(apiKey: string | undefined): ChatOpenAI | null {
  if (!hasKey(apiKey)) return null;
  return new ChatOpenAI({
    model: OPENROUTER_MODEL,
    apiKey,
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
 * Returns the planner model with an automatic fallback chain attached, so a
 * single `model.invoke(...)` transparently steps down when a provider is
 * unavailable. Order: OpenRouter (primary key) → OpenRouter (backup key) →
 * Groq → Bluesminds. Providers without a configured key are skipped.
 */
export function getAgentModel(): Runnable {
  const primary =
    openRouterModel(process.env.OPENROUTER_API_KEY) ??
    openRouterModel(process.env.OPENROUTER_API_KEY_BACKUP);

  const fallbacks = [
    openRouterModel(process.env.OPENROUTER_API_KEY_BACKUP),
    backendModel(
      process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_BACKUP,
      GROQ_BASE,
      GROQ_MODEL,
    ),
    backendModel(process.env.BLUESMINDS_API_KEY, BLUESMINDS_BASE, BLUESMINDS_MODEL),
  ].filter(Boolean) as ChatOpenAI[];

  if (!primary && fallbacks.length === 0) {
    throw new Error(
      "No AI provider configured for the agent graph. Set OPENROUTER_API_KEY, GROQ_API_KEY, or BLUESMINDS_API_KEY.",
    );
  }

  const base = primary ?? (fallbacks.shift() as ChatOpenAI);
  return fallbacks.length ? base.withFallbacks(fallbacks) : base;
}