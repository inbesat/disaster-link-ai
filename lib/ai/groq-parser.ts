// ---------------------------------------------------------------------
// lib/ai/groq-parser.ts
// Phase 17 Step 3 — Fast NLP parser (Groq integration).
//
// Turns chaotic citizen text (often Hinglish / regional-language shorthand)
// into a strictly typed, structured report. Uses Groq's OpenAI-compatible
// endpoint via @ai-sdk/openai for low-latency parsing; on any failure it
// returns a deterministic mock parse so the ingestion pipeline never breaks.
// ---------------------------------------------------------------------

import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

// ---------------------------------------------------------------------
// Strictly typed output shape (also used by /api/ingest/social).
// ---------------------------------------------------------------------
export const CitizenParseSchema = z.object({
  severity: z.number().int().min(0).max(100),
  issue: z.enum(["flood", "road_block", "rescue", "shelter_needed", "other"]),
  people_trapped: z.boolean(),
  people_count: z.number().int().min(0),
  locations: z.array(z.string()),
  summary: z.string(),
});

export type ParsedCitizenReport = z.infer<typeof CitizenParseSchema>;

// ---------------------------------------------------------------------
// Deterministic fallback parser (mock) used when Groq is unreachable or no
// key is configured. Extracts the signal without any network dependency.
// ---------------------------------------------------------------------
function mockParse(rawText: string): ParsedCitizenReport {
  const text = (rawText ?? "").toLowerCase();
  const hasTrapped = /\btrapped\b|stuck|caught|trapped in|phans\b|fans\b|logon\b/.test(text);
  const peopleMatch = text.match(/\b(\d{1,3})\s*(people|person|log|logical|adar|aadmi|kids|children|bache|logon|persons?)\b/);
  const peopleCount = peopleMatch ? Math.min(parseInt(peopleMatch[1], 10), 999) : 0;

  const locations: string[] = [];
  const districtMatch = text.match(/\b(patna|kankarbagh|boring road|patliputra|bailey road|danapur|phulwari|rajendra nagar|barh|fatwah|hajipur|mokama|bihta|khagaul|maner)\b/g);
  if (districtMatch) locations.push(...districtMatch.map((l) => l.charAt(0).toUpperCase() + l.slice(1)));

  let issue: ParsedCitizenReport["issue"] = "other";
  let severity = 40;
  if (/flood|water|paani|baadl|baadh|jala|dam|rising|drinking water/.test(text)) {
    issue = "flood";
    severity = 70;
  } else if (/road|block|rasta|jam|closed|crack|landslide/.test(text)) {
    issue = "road_block";
    severity = 55;
  } else if (/trapped|rescue|bachao|bachav|help us|stuck|catch|save/.test(text)) {
    issue = "rescue";
    severity = 85;
  } else if (/shelter|panaah|bhojan|need food|food|water needed|hospit|medicine/.test(text)) {
    issue = "shelter_needed";
    severity = 60;
  }
  if (hasTrapped) severity = Math.min(100, severity + 15);
  if (/urgent|emergency|critical|immediate|jaldi|turant/.test(text)) severity = Math.min(100, severity + 10);
  if (/madad|pls|please/.test(text)) severity = Math.min(100, severity + 5);

  return {
    severity,
    issue,
    people_trapped: hasTrapped,
    people_count: peopleCount,
    locations,
    summary: (rawText ?? "").trim().slice(0, 180) || "No description provided.",
  };
}

// ---------------------------------------------------------------------
// parseCitizenReport — primary entry point.
// Tries Groq (structured object generation); falls back to mockParse on any
// missing key, network error, rate-limit, or schema mismatch.
// ---------------------------------------------------------------------
export async function parseCitizenReport(rawText: string): Promise<ParsedCitizenReport> {
  const text = String(rawText ?? "").trim();
  if (!text) return mockParse(text);

  const groqKey =
    process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_BACKUP;
  if (!groqKey) {
    console.warn("[groq-parser] No GROQ_API_KEY — returning mock parse.");
    return mockParse(text);
  }

  try {
    const groq = createOpenAI({ name: "groq", baseURL: GROQ_BASE, apiKey: groqKey });
    const { object } = await generateObject({
      model: groq.chat(GROQ_MODEL),
      schema: CitizenParseSchema,
      system:
        "You parse disaster reports from citizens. Extract the severity (0-100), the exact issue " +
        "(flood, road_block, rescue, shelter_needed, other), and whether people are trapped. " +
        "The text may be in Hinglish or regional languages (Hindi, Bhojpuri, Maithili, Bengali). " +
        "Infer from context. Return ONLY the structured JSON.",
      prompt: text,
      temperature: 0.2,
    });
    return object;
  } catch (error: unknown) {
    console.warn("[groq-parser] Groq call failed — returning mock parse.", error);
    return mockParse(text);
  }
}

/** Issue label helper for map markers / UI. */
export function issueLabel(issue: ParsedCitizenReport["issue"]): string {
  switch (issue) {
    case "flood":
      return "Flood";
    case "road_block":
      return "Road Block";
    case "rescue":
      return "Rescue";
    case "shelter_needed":
      return "Shelter Needed";
    default:
      return "Other";
  }
}
