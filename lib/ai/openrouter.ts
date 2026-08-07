import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const GROQ_BASE = "https://api.groq.com/openai/v1";
const BLUESMINDS_BASE = "https://api.bluesminds.com/v1";

const OPENROUTER_MODEL = "anthropic/claude-3.5-sonnet";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const BLUESMINDS_MODEL = "openai/gpt-4o";

function pick(
  primary: string | undefined,
  backup: string | undefined,
): string | undefined {
  return primary && primary.length > 8 ? primary : backup;
}

const openRouterKey = pick(
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_BACKUP,
);

// Primary planner model — Anthropic Claude 3.5 Sonnet routed through OpenRouter.
export const openRouterModel = createOpenAI({
  name: "openrouter",
  baseURL: OPENROUTER_BASE,
  apiKey: openRouterKey ?? "missing-openrouter-key",
}).chat(OPENROUTER_MODEL);

// Backup providers (Groq + Bluesminds are OpenAI-compatible). The tool-calling
// routes try `openRouterModel` first and step down this chain when a request
// throws (missing key, rate limit, or upstream outage).
const fallbackModels: LanguageModel[] = [];

const groqKey = pick(process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_BACKUP);
if (groqKey) {
  fallbackModels.push(
    createOpenAI({ name: "groq", baseURL: GROQ_BASE, apiKey: groqKey }).chat(GROQ_MODEL),
  );
}

if (process.env.BLUESMINDS_API_KEY) {
  fallbackModels.push(
    createOpenAI({
      name: "bluesminds",
      baseURL: BLUESMINDS_BASE,
      apiKey: process.env.BLUESMINDS_API_KEY,
    }).chat(BLUESMINDS_MODEL),
  );
}

export const modelFallbackChain: LanguageModel[] = fallbackModels;

/**
 * Ordered list of model instances to try in sequence: OpenRouter Claude first,
 * then Groq, then Bluesminds.
 */
export const emergencyPlannerModels: LanguageModel[] = [
  openRouterModel,
  ...modelFallbackChain,
];

export function getEmergencyPlannerModel(): LanguageModel {
  return openRouterModel;
}
