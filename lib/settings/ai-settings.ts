// ---------------------------------------------------------------------
// lib/settings/ai-settings.ts — AI Assistant & LLM Preferences (Phase 4).
//
// Pure model + sanitizer + localStorage accessors for AI preferences.
// Every Phase 4 card reads/writes this one snapshot, so the assistant
// behaviour is consistent across the settings page and (later) the
// in-dashboard command panel.
// ---------------------------------------------------------------------

export type AiProvider =
  | "openai-gpt4o"
  | "anthropic-claude35"
  | "groq-llama3"
  | "local-airgapped";

export type ResponseVerbosity = "concise" | "balanced" | "detailed";
export type AiPersonality = "professional" | "collaborative" | "urgent";

export type AiToolKey =
  | "readFloodPredictions"
  | "queryShelterCapacity"
  | "accessResourceInventory"
  | "readAttendanceLogs"
  | "modifyUserProfiles";

export type AiToolAccess = Record<AiToolKey, boolean>;

/** Human-in-the-loop guardrail for operational plan execution. */
export type PlanExecutionMode = "auto" | "suggest" | "disabled";

export type ContextRetention = "1d" | "7d" | "30d" | "forever";

export type AiMemorySettings = {
  /** How long chat context is retained before archival/pruning. */
  retention: ContextRetention;
  /** Auto-archive resolved emergency threads to reclaim context space. */
  autoArchiveResolved: boolean;
};

export type RagSourceKey =
  | "ndmaGuidelines"
  | "stateSops"
  | "ddmp"
  | "internationalProtocols";

export type AiRagSources = Record<RagSourceKey, boolean>;

export type AiSettings = {
  provider: AiProvider;
  /** Operator-supplied key — stored only in local state, never transmitted. */
  apiKey: string;
  /** How verbose assistant replies are (Concise → Detailed). */
  responseVerbosity: ResponseVerbosity;
  /** Assistant tone / persona: formal, team-oriented or action-focused. */
  personality: AiPersonality;
  /** Agentic tool guardrails — which tools the AI may call. */
  toolAccess: AiToolAccess;
  /** Whether drafted operational plans execute automatically or wait for a human. */
  planExecutionMode: PlanExecutionMode;
  /** Chat history retention & archiving. */
  memory: AiMemorySettings;
  /** Knowledge base documents the assistant may search (RAG). */
  ragSources: AiRagSources;
  /** Opt-in telemetry of ratings + corrected plans to improve the model. */
  feedbackLoop: boolean;
};

export const DRIP_AI_SETTINGS_KEY = "drip_ai_settings_v1";

export const AI_PROVIDERS: {
  value: AiProvider;
  label: string;
  hint: string;
}[] = [
  { value: "openai-gpt4o", label: "OpenAI GPT-4o", hint: "Free tier via OpenRouter" },
  { value: "anthropic-claude35", label: "Anthropic Claude 3.5 Sonnet", hint: "Free tier via OpenRouter" },
  { value: "groq-llama3", label: "Groq Llama-3", hint: "Externally hosted · Llama-3 70B" },
  { value: "local-airgapped", label: "Local / Air-Gapped Model", hint: "No cloud round-trip" },
];

export const DEFAULT_TOOL_ACCESS: AiToolAccess = {
  readFloodPredictions: true,
  queryShelterCapacity: true,
  accessResourceInventory: true,
  readAttendanceLogs: true,
  modifyUserProfiles: false,
};

export const DEFAULT_MEMORY_SETTINGS: AiMemorySettings = {
  retention: "1d",
  autoArchiveResolved: true,
};

export const DEFAULT_RAG_SOURCES: AiRagSources = {
  ndmaGuidelines: true,
  stateSops: true,
  ddmp: true,
  internationalProtocols: true,
};

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: "openai-gpt4o",
  apiKey: "",
  responseVerbosity: "balanced",
  personality: "professional",
  toolAccess: { ...DEFAULT_TOOL_ACCESS },
  // Organizational standard: human Commander authorizes every plan.
  planExecutionMode: "suggest",
  memory: { ...DEFAULT_MEMORY_SETTINGS },
  ragSources: { ...DEFAULT_RAG_SOURCES },
  // Privacy-safe default: feedback sharing is opt-in.
  feedbackLoop: false,
};

const PROVIDERS: AiProvider[] = AI_PROVIDERS.map((option) => option.value);
const VERBOSITIES: ResponseVerbosity[] = ["concise", "balanced", "detailed"];
const PERSONALITIES: AiPersonality[] = [
  "professional",
  "collaborative",
  "urgent",
];
const PLAN_EXECUTION_MODES: PlanExecutionMode[] = ["auto", "suggest", "disabled"];
const RETENTIONS: ContextRetention[] = ["1d", "7d", "30d", "forever"];

/** Guarded merge — corrupt or partial snapshots never break the AI settings. */
export function mergeAiSettings(raw: unknown): AiSettings {
  const base: AiSettings = { ...DEFAULT_AI_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Record<string, unknown>;
  if (
    typeof data.provider === "string" &&
    PROVIDERS.includes(data.provider as AiProvider)
  ) {
    base.provider = data.provider as AiProvider;
  }
  if (typeof data.apiKey === "string") {
    base.apiKey = data.apiKey.slice(0, 512);
  }
  if (
    typeof data.responseVerbosity === "string" &&
    VERBOSITIES.includes(data.responseVerbosity as ResponseVerbosity)
  ) {
    base.responseVerbosity = data.responseVerbosity as ResponseVerbosity;
  }
  if (
    typeof data.personality === "string" &&
    PERSONALITIES.includes(data.personality as AiPersonality)
  ) {
    base.personality = data.personality as AiPersonality;
  }
  base.toolAccess = sanitizeToolAccess(data.toolAccess);
  if (
    typeof data.planExecutionMode === "string" &&
    PLAN_EXECUTION_MODES.includes(data.planExecutionMode as PlanExecutionMode)
  ) {
    base.planExecutionMode = data.planExecutionMode as PlanExecutionMode;
  }
  base.memory = sanitizeMemory(data.memory);
  base.ragSources = sanitizeRagSources(data.ragSources);
  if (typeof data.feedbackLoop === "boolean") {
    base.feedbackLoop = data.feedbackLoop as boolean;
  }
  return base;
}

function sanitizeRagSources(raw: unknown): AiRagSources {
  const out = { ...DEFAULT_RAG_SOURCES };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(out) as RagSourceKey[]) {
    if (typeof src[key] === "boolean") out[key] = src[key] as boolean;
  }
  return out;
}

function sanitizeMemory(raw: unknown): AiMemorySettings {
  const out = { ...DEFAULT_MEMORY_SETTINGS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  if (
    typeof src.retention === "string" &&
    RETENTIONS.includes(src.retention as ContextRetention)
  ) {
    out.retention = src.retention as ContextRetention;
  }
  if (typeof src.autoArchiveResolved === "boolean") {
    out.autoArchiveResolved = src.autoArchiveResolved as boolean;
  }
  return out;
}

function sanitizeToolAccess(raw: unknown): AiToolAccess {
  const out = { ...DEFAULT_TOOL_ACCESS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const key of Object.keys(out) as AiToolKey[]) {
    if (typeof src[key] === "boolean") out[key] = src[key] as boolean;
  }
  return out;
}

/** Deep copy of the defaults — callers never mutate the shared const. */
export function cloneDefaultAiSettings(): AiSettings {
  return mergeAiSettings(null);
}

export function readStoredAiSettings(): AiSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRIP_AI_SETTINGS_KEY);
    if (!raw) return null;
    return mergeAiSettings(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeStoredAiSettings(settings: AiSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRIP_AI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // storage full / blocked — ignore for the demo
  }
}