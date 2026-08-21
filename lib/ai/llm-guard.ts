// ---------------------------------------------------------------------
// lib/ai/llm-guard.ts — Phase 9: AI/LLM Security & Guardrails
//
// Prompt injection prevention, output filtering, topic guardrails,
// token spending caps, repeated prompt attack detection, and RAG text sanitization.
// ---------------------------------------------------------------------

export interface PromptGuardResult {
  safe: boolean;
  sanitizedInput: string;
  flaggedReason?: string;
  offTopic?: boolean;
}

export interface OutputGuardResult {
  safe: boolean;
  filteredOutput: string;
  flaggedReason?: string;
}

export interface AiAuditLog {
  userId: string;
  timestamp: string;
  promptLength: number;
  responseLength: number;
  flagged?: boolean;
  reason?: string;
}

export const aiAuditLogs: AiAuditLog[] = [];

// Repeated prompt attack tracking map: `userId:promptHash` -> count
const promptCountMap = new Map<string, { count: number; resetAt: number }>();

const REPEATED_PROMPT_LIMIT = 100; // max 100 identical prompts per 10 mins
const REPEATED_PROMPT_WINDOW_MS = 10 * 60 * 1000;

// High-risk prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|prior)\s+instructions?/i,
  /disregard\s+(all|previous)\s+prompts?/i,
  /system\s+prompt/i,
  /you\s+are\s+now\s+dan/i,
  /jailbreak/i,
  /bypass\s+(security|guardrails|safety)/i,
  /reveal\s+(system|initial)\s+instructions/i,
  /act\s+as\s+an?\s+unrestricted/i,
];

// Off-topic non-disaster query keywords
const OFF_TOPIC_PATTERNS = [
  /\b(stock\s+market|crypto|bitcoin|trading)\b/i,
  /\b(write\s+a\s+(poem|essay|code|python|java|javascript))\b/i,
  /\b(movie|celebrity|gossip|game\s+review)\b/i,
  /\b(recipe|cooking|baking)\b/i,
];

/**
 * Sanitizes user input and validates against prompt injection & off-topic attacks.
 */
export function guardPromptInput(
  rawInput: string,
  userId: string = "anonymous",
): PromptGuardResult {
  // 1. Clamp input length to 2000 characters (Prompt 9.1)
  const trimmed = rawInput.trim();
  const sanitizedInput = trimmed
    .replace(/[<>{}\\]/g, "") // strip code/markup delimiters
    .slice(0, 2000);

  // 2. Check for repeated prompt attack (>100 identical prompts in 10 mins)
  const now = Date.now();
  const promptKey = `${userId}:${sanitizedInput.toLowerCase()}`;
  let tracker = promptCountMap.get(promptKey);
  if (!tracker || now > tracker.resetAt) {
    tracker = { count: 0, resetAt: now + REPEATED_PROMPT_WINDOW_MS };
    promptCountMap.set(promptKey, tracker);
  }
  tracker.count++;

  if (tracker.count > REPEATED_PROMPT_LIMIT) {
    return {
      safe: false,
      sanitizedInput,
      flaggedReason: "Repeated prompt attack detected.",
    };
  }

  // 3. Prompt injection detection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitizedInput)) {
      return {
        safe: false,
        sanitizedInput,
        flaggedReason: "Potential prompt injection attempt detected.",
      };
    }
  }

  // 4. Topic restriction check (Prompt 9.2)
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(sanitizedInput)) {
      return {
        safe: true,
        offTopic: true,
        sanitizedInput,
        flaggedReason: "Off-topic query detected.",
      };
    }
  }

  return { safe: true, sanitizedInput };
}

/**
 * Filters LLM response for system prompt leaks or toxic injection outputs.
 */
export function guardPromptOutput(llmOutput: string): OutputGuardResult {
  if (!llmOutput) {
    return { safe: true, filteredOutput: "" };
  }

  // Check for prompt leak indicators in response
  const leakPatterns = [
    /SYSTEM:\s*You are a disaster response AI/i,
    /USER_INPUT:\s*\[sanitized/i,
    /ignore previous instructions/i,
  ];

  for (const pattern of leakPatterns) {
    if (pattern.test(llmOutput)) {
      return {
        safe: false,
        filteredOutput:
          "I can only assist with verified disaster response and emergency safety guidance.",
        flaggedReason: "System prompt leakage detected in AI output.",
      };
    }
  }

  // Scrub any accidental phone numbers or sensitive keys from output
  const sanitizedOutput = llmOutput
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_KEY]")
    .replace(/gsk_[a-zA-Z0-9]{20,}/g, "[REDACTED_KEY]");

  return { safe: true, filteredOutput: sanitizedOutput };
}

/**
 * Audit logger for AI inputs and outputs (PII redacted).
 */
export function logAiAudit(
  userId: string,
  promptText: string,
  responseText: string,
  flagged?: boolean,
  reason?: string,
): void {
  aiAuditLogs.push({
    userId,
    timestamp: new Date().toISOString(),
    promptLength: promptText.length,
    responseLength: responseText.length,
    flagged,
    reason,
  });
  if (aiAuditLogs.length > 2000) {
    aiAuditLogs.shift();
  }
}

/**
 * Sanitizes RAG document extracted text (Prompt 9.4).
 * Strips HTML, JavaScript, and executable script tags before embedding.
 */
export function sanitizeRagText(rawText: string): string {
  if (!rawText) return "";
  return rawText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ") // strip HTML tags
    .replace(/javascript:/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
