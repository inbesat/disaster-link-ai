// ---------------------------------------------------------------------
// lib/i18n/ai-translator.ts — Phase 25 · Step 6.
//
// Blazing-fast emergency alert translation for SMS / push / in-app alerts,
// powered by Groq's low-latency OpenAI-compatible endpoint (same client
// pattern as lib/ai/groq-parser.ts from Phase 17).
//
// Guarantees:
//   • English → returned untouched (zero latency, zero cost).
//   • Any failure (missing key, network, rate-limit) → original text
//     returned, so the alert pipeline NEVER drops a critical message.
// ---------------------------------------------------------------------

import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/** Language-code → human name for the prompt (focus: Indian languages). */
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  ml: "Malayalam",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
  mr: "Marathi",
  gu: "Gujarati",
  pa: "Punjabi",
  or: "Odia",
  as: "Assamese",
};

const SYSTEM_PROMPT =
  "You are a crisis translation engine. Translate the following emergency alert into {targetLanguage}. " +
  "Maintain urgency, accuracy, and keep it under 160 characters if possible. " +
  "Output ONLY the translated text, no pleasantries.";

/**
 * Resolve a language code (or name) into the human-readable target name
 * used inside the system prompt. Unknown codes pass through as-is.
 */
export function targetLanguageName(code: string): string {
  const key = code.trim().toLowerCase();
  return LANGUAGE_NAMES[key] ?? code.trim();
}

/**
 * Translate an English emergency alert for SMS / push delivery.
 * - `targetLanguageCode` "en" (or "English") → returns the text verbatim.
 * - Otherwise Groq translates it with the crisis-translation system prompt.
 * - Any failure returns the ORIGINAL text so alerts are never dropped.
 */
export async function translateAlertForSMS(
  englishText: string,
  targetLanguageCode: string,
): Promise<string> {
  const text = String(englishText ?? "").trim();
  if (!text) return text;

  const language = targetLanguageName(targetLanguageCode);
  if (language.toLowerCase() === "english" || targetLanguageCode.trim().toLowerCase() === "en") {
    return text;
  }

  const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_BACKUP;
  if (!groqKey) {
    console.warn("[ai-translator] No GROQ_API_KEY — returning untranslated alert.");
    return text;
  }

  try {
    const groq = createOpenAI({ name: "groq", baseURL: GROQ_BASE, apiKey: groqKey });
    const { text: translated } = await generateText({
      model: groq.chat(GROQ_MODEL),
      system: SYSTEM_PROMPT.replace("{targetLanguage}", language),
      prompt: text,
      temperature: 0.2,
    });

    let cleaned = (translated ?? "").trim();
    // Defensively strip quotes the model might wrap the answer in.
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    return cleaned || text;
  } catch (error) {
    console.warn(
      `[ai-translator] Translation to ${language} failed — returning original alert.`,
      error,
    );
    return text;
  }
}
