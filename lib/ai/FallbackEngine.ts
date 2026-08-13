// ---------------------------------------------------------------------
// lib/ai/FallbackEngine.ts — Zero-MB Offline Logic Engine (Tier 3)
//
// The 100% foolproof offline fallback: plain JavaScript, zero downloads,
// zero WebGPU/RAM requirements. Used when the device can't run WebLLM
// (no WebGPU, <4 GB RAM) or the local inference crashes — the bridge
// steps down here instead of leaving the user with "I'm offline."
//
//   • Reuses the curated 61-entry rule set (lib/ai-bridge/rule-based-fallback)
//     for flood / cyclone / earthquake / first-aid / kit / power-outage ...
//   • Shelter queries are answered from `districtContext` when it carries
//     the cached Dexie shelter rows — the nearest open shelter, no internet.
//   • Unmatched prompts get the safe low-power default verbatim.
// ---------------------------------------------------------------------

import { RULE_RESPONSES } from "@/lib/ai-bridge/rule-based-fallback";

/** Safe default when no rule matches (spec verbatim). */
export const FALLBACK_DEFAULT_RESPONSE =
  "I am operating in low-power offline mode. Please head to high ground or the nearest shelter. If you are in immediate danger, use the SOS button.";

/** A shelter shape inside the offline cache payloads. */
export interface FallbackShelter {
  name?: unknown;
  address?: unknown;
  distance?: unknown;
  occupancy?: unknown;
  capacity?: unknown;
  lat?: unknown;
  lng?: unknown;
}

/** One OfflineRecord row from the Dexie `shelters` table. */
interface CachedRowLike {
  data?: unknown;
  district?: unknown;
}

function asNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Pulls shelter entries out of `districtContext`, which may be the raw
 * OfflineRecord rows from db.shelters, a bare array of shelter objects,
 * or nothing at all (a plain context string / null). Never throws.
 */
export function sheltersFromContext(districtContext: unknown): FallbackShelter[] {
  if (districtContext === null || districtContext === undefined) return [];
  if (typeof districtContext === "string") return [];

  const rows = Array.isArray(districtContext) ? districtContext : [districtContext];
  const shelters: FallbackShelter[] = [];

  for (const row of rows) {
    if (row === null || typeof row !== "object") continue;
    // OfflineRecord wrapper → the payload lives under `.data`.
    const payload = "data" in row ? (row as CachedRowLike).data : row;
    if (payload === null || typeof payload !== "object") continue;
    const shelter = payload as FallbackShelter;
    if (shelter.name === undefined && shelter.address === undefined) continue;
    shelters.push(shelter);
  }

  // Nearest first when distances are present.
  return shelters.sort((a, b) => {
    const da = asNumber(a.distance);
    const db = asNumber(b.distance);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });
}

/** Renders the nearest shelter answer from cached rows. */
function nearestShelterText(shelters: FallbackShelter[]): string {
  const best = shelters[0];
  const name = typeof best.name === "string" ? best.name : "the nearest shelter";
  const address = typeof best.address === "string" ? best.address : "";
  const distance = asNumber(best.distance);
  const occupancy = asNumber(best.occupancy);
  const capacity = asNumber(best.capacity);

  const parts = [`Nearest shelter: ${name}`];
  if (address) parts.push(`at ${address}`);
  if (distance !== null) parts.push(`(${distance} km away)`);
  if (occupancy !== null && capacity !== null) {
    parts.push(`— ${capacity - occupancy} safe berths remaining.`);
  } else if (capacity !== null) {
    parts.push(`— capacity ${capacity}.`);
  }
  parts.push("Open the Resources tab or the map to navigate there.");
  return parts.join(" ");
}

/**
 * Zero-MB offline answer engine.
 *
 * @param userPrompt      The user's question (matched with basic NLP).
 * @param districtContext Optional offline Dexie data — shelter rows make
 *                        "nearest shelter" queries answer from real cache.
 */
export function generateFallbackResponse(
  userPrompt: string,
  districtContext?: unknown,
): string {
  const normalized = userPrompt.toLowerCase().trim();

  // Shelter-aware: answer from cached rows before falling back to the static rule.
  const asksShelter =
    normalized.includes("shelter") ||
    normalized.includes("where do i go") ||
    normalized.includes("nearest");
  if (asksShelter) {
    const shelters = sheltersFromContext(districtContext);
    if (shelters.length > 0) return nearestShelterText(shelters);
  }

  // Static rule set — broad phrase / word-stemmed keys.
  for (const entry of RULE_RESPONSES) {
    if (entry.keys.some((key) => normalized.includes(key))) {
      return entry.response;
    }
  }

  return FALLBACK_DEFAULT_RESPONSE;
}

export default generateFallbackResponse;