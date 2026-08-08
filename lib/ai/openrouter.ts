import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// ---------------------------------------------------------------------
// lib/ai/openrouter.ts — resilient LLM provider chain for the AI planner.
//
// The emergency planner chats through the first *healthy* OpenAI-compatible
// provider instead of a single hard-coded model. Candidates are probed with
// a cheap 1-token chat call and the winner is cached for a short TTL, so
// the chat keeps working when a specific vendor is broken. Real examples
// of what this absorbs (verified Aug 2026):
//
//   • OpenRouter removed `anthropic/claude-3.5-sonnet` → HTTP 404.
//   • The primary OpenRouter account had zero credits → HTTP 402.
//   • Bluesminds dropped `openai/gpt-4o` → HTTP 503 model_not_found.
//   • The OpenRouter backup account had ~1,500 tokens of credit left, so a
//     real chat request (max_tokens 65k default) 402'd even though a 1-token
//     probe passed — the probe must request a realistic budget.
//   • AI SDK v7 stops after ONE step by default, so Groq models that called
//     a tool never produced the final summary — fixed with `stopWhen` in
//     app/api/chat/route.ts.
//
// Chain order: Groq (free, unlimited) → OpenRouter (primary key) →
// OpenRouter (backup key) → Bluesminds. Each provider gets one candidate
// PER KEY so a dead primary key never blocks a working backup. Providers
// with no configured key are skipped entirely — the code NEVER sends a
// placeholder "missing-…-key" string upstream. Groq leads because it is
// free and has no per-token credit ceiling; OpenRouter only wins once its
// account can afford a realistic response budget (it passes the probe).
// ---------------------------------------------------------------------

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const GROQ_BASE = "https://api.groq.com/openai/v1";
const BLUESMINDS_BASE = "https://api.bluesminds.com/v1";

// Live model ids — verified against each provider's /models endpoint.
const OPENROUTER_MODEL = "~anthropic/claude-sonnet-latest";
// gpt-oss-120b: strong tool-calling on Groq's free tier (llama-3.3-70b-
// versatile would stop right after a tool call instead of summarising).
const GROQ_MODEL = "openai/gpt-oss-120b";
const BLUESMINDS_MODEL = "meta/llama-3.1-8b-instruct";

const PROBE_TIMEOUT_MS = 8_000;
/** How long a probed provider is trusted before re-probing. */
const RESOLVER_TTL_MS = 60_000;
/**
 * The probe requests this many output tokens. A provider whose account
 * cannot afford a realistic response budget (e.g. OpenRouter with a few
 * hundred tokens of credit) fails the probe and is skipped — otherwise the
 * stream would 402 mid-chat. Keep in sync with the chat route's
 * `maxOutputTokens`.
 */
const PROBE_MAX_TOKENS = 2048;

type ProviderCandidate = {
  name: string;
  model: LanguageModel;
  probe: { baseURL: string; model: string; apiKey: string };
};

/** A usable key is longer than a placeholder — anything else is ignored. */
function hasKey(value: string | undefined): value is string {
  return Boolean(value && value.length > 8);
}

function addCandidate(
  candidates: ProviderCandidate[],
  name: string,
  key: string,
  baseURL: string,
  modelId: string,
): void {
  candidates.push({
    name,
    model: createOpenAI({ name, baseURL, apiKey: key }).chat(modelId),
    probe: { baseURL, model: modelId, apiKey: key },
  });
}

function buildCandidates(): ProviderCandidate[] {
  const candidates: ProviderCandidate[] = [];

  // Groq first — free tier, no per-request credit ceiling, tool calling
  // supported on gpt-oss-120b. One entry per key (primary + backup).
  if (hasKey(process.env.GROQ_API_KEY)) {
    addCandidate(candidates, "groq", process.env.GROQ_API_KEY, GROQ_BASE, GROQ_MODEL);
  }
  if (hasKey(process.env.GROQ_API_KEY_BACKUP)) {
    addCandidate(
      candidates,
      "groq-backup",
      process.env.GROQ_API_KEY_BACKUP,
      GROQ_BASE,
      GROQ_MODEL,
    );
  }

  // OpenRouter gets one entry per key so a dead primary account (e.g. 402)
  // never blocks the working backup account. A key with no credits fails the
  // realistic-budget probe and is skipped.
  if (hasKey(process.env.OPENROUTER_API_KEY)) {
    addCandidate(
      candidates,
      "openrouter",
      process.env.OPENROUTER_API_KEY,
      OPENROUTER_BASE,
      OPENROUTER_MODEL,
    );
  }
  if (hasKey(process.env.OPENROUTER_API_KEY_BACKUP)) {
    addCandidate(
      candidates,
      "openrouter-backup",
      process.env.OPENROUTER_API_KEY_BACKUP,
      OPENROUTER_BASE,
      OPENROUTER_MODEL,
    );
  }

  if (hasKey(process.env.BLUESMINDS_API_KEY)) {
    addCandidate(
      candidates,
      "bluesminds",
      process.env.BLUESMINDS_API_KEY,
      BLUESMINDS_BASE,
      BLUESMINDS_MODEL,
    );
  }

  return candidates;
}

async function probeCandidate(candidate: ProviderCandidate): Promise<boolean> {
  try {
    const res = await fetch(`${candidate.probe.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${candidate.probe.apiKey}`,
      },
      body: JSON.stringify({
        model: candidate.probe.model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: PROBE_MAX_TOKENS,
      }),
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Module-level cache — each serverless instance remembers the last provider
// that answered, so follow-up requests skip the probe entirely.
let cachedCandidate: ProviderCandidate | null = null;
let lastResolvedAt = 0;
let inFlight: Promise<LanguageModel> | null = null;

/**
 * Returns a LanguageModel guaranteed (as of the last probe, max TTL ago) to
 * answer. Throws only when no provider key is configured at all — callers
 * should guard with `hasAnyAiProviderConfigured()` first and serve a mock.
 */
export async function resolveEmergencyPlannerModel(): Promise<LanguageModel> {
  const now = Date.now();
  if (cachedCandidate && now - lastResolvedAt < RESOLVER_TTL_MS) {
    return cachedCandidate.model;
  }
  // Dedupe concurrent cold-start probes (first chat message after boot).
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const candidates = buildCandidates();
    for (const candidate of candidates) {
      const healthy = await probeCandidate(candidate);
      if (healthy) {
        cachedCandidate = candidate;
        lastResolvedAt = Date.now();
        return candidate.model;
      }
      console.warn(`[openrouter] provider "${candidate.name}" failed probe; stepping down.`);
    }

    // All probes failed — this may be a transient outage. Reuse the last
    // known-good provider rather than dropping the request.
    if (cachedCandidate) {
      console.warn(
        `[openrouter] all providers failed probe; reusing last known-good "${cachedCandidate.name}".`,
      );
      return cachedCandidate.model;
    }

    throw new Error(
      "No AI provider is configured. Set OPENROUTER_API_KEY (or _BACKUP), GROQ_API_KEY, or BLUESMINDS_API_KEY in the server environment.",
    );
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

/** True when at least one provider key is present in the environment. */
export function hasAnyAiProviderConfigured(): boolean {
  return buildCandidates().length > 0;
}
