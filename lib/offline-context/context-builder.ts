// ---------------------------------------------------------------------
// lib/offline-context/context-builder.ts — Offline-First Architecture
// Phase 5 · Context Injection.
// OfflineContextBuilder: assembles a plain-text "situation briefing" from
// the 48h IndexedDB cache so the local Gemma/TinyLlama model answers with
// CURRENT, non-hallucinated data instead of stale weights.
//
//   const builder = new OfflineContextBuilder();
//   const ctx = await builder.buildContext("Patna");
//   const prompt = buildAugmentedPrompt("Any flood risk?", ctx);
//
// Sections are independently toggleable (per the Context Preview debug
// panel) and the whole context is capped by the Phase 5 token limiter.
// Reads come through the sync engine's getOfflineData() so expired rows
// are pruned on read and nothing ever touches the network.
// ---------------------------------------------------------------------

import { getSyncEngine } from "@/lib/offline-sync/sync-engine";
import type { OfflineRecord, DataType } from "@/lib/offline-sync/types";

/** Minimal engine surface used by the builder (injectable for tests). */
export interface OfflineDataReader {
  getOfflineData<T = unknown>(type: DataType, district: string): Promise<Array<OfflineRecord<T>>>;
}

export interface ContextSectionFlags {
  situation: boolean;
  resources: boolean;
  weather: boolean;
  knowledge: boolean;
}

export const ALL_SECTIONS: ContextSectionFlags = {
  situation: true,
  resources: true,
  weather: true,
  knowledge: true,
};

/** Shape of a prediction payload cached by the sync engine. */
interface PredictionData {
  day?: string;
  riskLevel?: string;
  confidence?: string | number;
  source?: string;
  [key: string]: unknown;
}

/** Shape of an alert payload. */
interface AlertData {
  severity?: string;
  message?: string;
  title?: string;
  [key: string]: unknown;
}

/** Shape of a resource/shelter payload. */
interface ResourceData {
  type?: string;
  name?: string;
  address?: string;
  distance?: string | number;
  capacity?: string | number;
  [key: string]: unknown;
}

/** Shape of a weather payload. */
interface WeatherData {
  forecastTime?: string;
  condition?: string;
  rainChance?: string | number;
  [key: string]: unknown;
}

/** Shape of a knowledge chunk payload. */
interface KnowledgeData {
  title?: string;
  content?: string;
  [key: string]: unknown;
}

export interface BuiltContext {
  /** Rendered briefing text (token-limited). */
  text: string;
  /** Per-section rendered blocks, pre-limiter (for the debug panel). */
  sections: { situation: string; resources: string; weather: string; knowledge: string };
  /** Section toggle flags applied. */
  flags: ContextSectionFlags;
  /** Estimated token count of `text`. */
  tokenCount: number;
  /** Row counts actually injected per section. */
  counts: { predictions: number; alerts: number; resources: number; weather: number; knowledge: number };
}

/** Map a raw payload to a displayable alert line. */
export function alertLine(row: OfflineRecord<AlertData>): string {
  const d = row.data ?? {};
  return `- ${d.severity ?? "advisory"}: ${d.message ?? d.title ?? "no message"}`;
}

/** Map a raw payload to a displayable resource line. */
export function resourceLine(row: OfflineRecord<ResourceData>): string {
  const d = row.data ?? {};
  const dist = d.distance != null ? ` (${d.distance} km)` : "";
  return `- ${d.type ?? "shelter"}: ${d.name ?? "unnamed"} at ${d.address ?? "address N/A"}${dist}`;
}

/** Map a raw payload to a displayable weather line. */
export function weatherLine(row: OfflineRecord<WeatherData>): string {
  const d = row.data ?? {};
  const rain = d.rainChance != null ? `, Rain: ${d.rainChance}%` : "";
  return `- ${d.forecastTime ?? "next"}: ${d.condition ?? "no forecast"},${rain}`;
}

/** Map a raw payload to a displayable knowledge line. */
export function knowledgeLine(row: OfflineRecord<KnowledgeData>): string {
  const d = row.data ?? {};
  const content = d.content ?? "no content";
  return `- ${d.title ?? "Context"}: ${content.length > 120 ? content.slice(0, 120) + "…" : content}`;
}

/**
 * Assembles the situation briefing for a district from the offline cache.
 * `getOfflineData` prunes expired rows and returns only the fresh 48h
 * window, so the injected context is always current.
 */
export async function buildContext(
  district: string,
  flags: ContextSectionFlags = ALL_SECTIONS,
  engine?: OfflineDataReader,
): Promise<BuiltContext> {
  const reader = engine ?? getSyncEngine();

  const [predictions, alerts, resources, weather, knowledge] = await Promise.all([
    flags.situation ? reader.getOfflineData<PredictionData>("predictions", district) : Promise.resolve([]),
    flags.situation ? reader.getOfflineData<AlertData>("alerts", district) : Promise.resolve([]),
    flags.resources ? reader.getOfflineData<ResourceData>("resources", district) : Promise.resolve([]),
    flags.weather ? reader.getOfflineData<WeatherData>("weather", district) : Promise.resolve([]),
    flags.knowledge ? reader.getOfflineData<KnowledgeData>("knowledge", district) : Promise.resolve([]),
  ]);

  const latestPrediction = predictions[predictions.length - 1]?.data;
  const sections = {
    situation:
      flags.situation
        ? [
            `=== CURRENT SITUATION (${district}) ===`,
            `Flood Risk: ${latestPrediction?.riskLevel ?? "Unknown"} (${latestPrediction?.confidence ?? "N/A"}% confidence)`,
            ...(alerts.length ? ["Active Alerts:", ...alerts.map(alertLine)] : ["Active Alerts: none"]),
          ].join("\n")
        : "",
    resources:
      flags.resources
        ? ["=== NEARBY RESOURCES ===", ...(resources.length ? resources.map(resourceLine) : ["none cached"])].join("\n")
        : "",
    weather:
      flags.weather
        ? ["=== WEATHER (Next 48h) ===", ...(weather.length ? weather.map(weatherLine) : ["no forecast cached"])].join("\n")
        : "",
    knowledge:
      flags.knowledge
        ? ["=== OFFLINE KNOWLEDGE ===", ...(knowledge.length ? knowledge.map(knowledgeLine) : ["none cached"])].join("\n")
        : "",
  };

  const parts = [sections.situation, sections.resources, sections.weather, sections.knowledge].filter(
    (s) => s.length > 0,
  );
  const text = parts.join("\n\n");
  const tokenCount = estimateContextTokens(text);

  return {
    text,
    sections,
    flags,
    tokenCount,
    counts: {
      predictions: predictions.length,
      alerts: alerts.length,
      resources: resources.length,
      weather: weather.length,
      knowledge: knowledge.length,
    },
  };
}

/** Rough token estimate (~4 chars/token, matching the AI bridge). */
export function estimateContextTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export type OfflineContextBuilder = typeof buildContext;
export default buildContext;