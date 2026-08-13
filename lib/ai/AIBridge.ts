"use client";

// ---------------------------------------------------------------------
// lib/ai/AIBridge.ts — routeChatQuery: the chat router (cloud ↔ local).
//
// Thin entry point over the existing routing stack (lib/ai-bridge/):
//
//   • Online  → the standard /api/chat endpoint via the shared AIBridge
//               (CloudAIProvider) — the same tool-calling planner the
//               dashboard uses, with RAG grounding + provider failover.
//   • Offline → pulls the 48-hour Dexie cache (DisasterLinkDB) for the
//               district, summarizes it into a readable context string,
//               and answers from the in-browser WebLLM model via
//               LocalLLMProvider.generateLocalResponse — zero network.
//
// Returns { text, source: 'cloud' | 'local' } so callers can badge the
// reply. Shared singletons are reused throughout (getAIBridge /
// getLocalLLMProvider / getOfflineDb), so a warm model or monitor state
// is never duplicated.
// ---------------------------------------------------------------------

import { getAIBridge } from "@/lib/ai-bridge/ai-bridge";
import { getLocalLLMProvider } from "@/lib/ai/LocalLLMProvider";
import { getOfflineDb } from "@/lib/offline-sync/db";
import type { OfflineRecord } from "@/lib/offline-sync/types";

export interface RouteChatResult {
  /** The assistant's reply text. */
  text: string;
  /** Which engine produced it. */
  source: "cloud" | "local";
}

/** Rows still inside the 48h offline window. */
function freshRows(rows: Array<OfflineRecord<unknown>>): Array<OfflineRecord<unknown>> {
  const now = Date.now();
  return rows.filter((row) => new Date(row.expiresAt).getTime() >= now);
}

/** Best-effort risk level derived from prediction payloads. */
function riskLevelFrom(rows: Array<OfflineRecord<unknown>>): string {
  const values: string[] = [];
  for (const row of rows) {
    const data = (row.data ?? {}) as Record<string, unknown>;
    for (const key of ["risk", "riskLevel", "severity", "level"]) {
      const value = data[key];
      if (typeof value === "string" || typeof value === "number") {
        values.push(String(value));
      }
    }
  }
  const order = ["critical", "high", "medium", "moderate", "low"];
  for (const level of order) {
    if (values.some((v) => v.toLowerCase().includes(level))) return level.toUpperCase();
  }
  return values.length > 0 ? values[0].toUpperCase() : "Unknown";
}

/**
 * Loads the district's 48h offline cache from DisasterLinkDB and formats
 * it into a compact context string for the local model, e.g.:
 *
 *   "Current Offline Context: District Patna · 2 Shelters open ·
 *    Risk Level: HIGH · 5 active alerts · 12 predictions cached"
 */
async function loadOfflineContext(district: string): Promise<string> {
  try {
    const db = getOfflineDb();
    const [predictions, alerts, shelters, resources] = await Promise.all([
      freshRows(await db.predictions.where("district").equals(district).toArray()),
      freshRows(await db.alerts.where("district").equals(district).toArray()),
      freshRows(await db.shelters.where("district").equals(district).toArray()),
      freshRows(await db.resources.where("district").equals(district).toArray()),
    ]);

    const lines = [
      `Current Offline Context for district ${district}`,
      `- Predictions cached: ${predictions.length}`,
      `- Open shelters: ${shelters.length}`,
      `- Active alerts: ${alerts.length}`,
      `- Resources cached: ${resources.length}`,
      `- Risk Level: ${riskLevelFrom(predictions)}`,
    ];
    return lines.join("\n");
  } catch {
    // IndexedDB unavailable (SSR / first paint) — the model still answers,
    // just without cached ground truth.
    return `Current Offline Context: no cached data available for ${district}.`;
  }
}

/**
 * Routes a chat message to cloud or local AI depending on connectivity.
 *
 * @param userMessage The user's prompt.
 * @param district    District scoping — used for the cloud call and to
 *                    load the district's offline cache.
 */
export async function routeChatQuery(
  userMessage: string,
  district: string,
): Promise<RouteChatResult> {
  const online = typeof navigator !== "undefined" ? navigator.onLine : true;

  // ---- Cloud path: the standard /api/chat planner. -------------------
  if (online) {
    const bridge = getAIBridge();
    const response = await bridge.route(userMessage, { currentDistrict: district });
    return {
      text: response.text,
      // The bridge may step down to local if the cloud call errored.
      source: response.mode === "local" ? "local" : "cloud",
    };
  }

  // ---- Offline path: 48h Dexie cache → local WebLLM model. -----------
  const contextData = await loadOfflineContext(district);
  const local = getLocalLLMProvider();
  const response = await local.generateLocalResponse(userMessage, contextData);
  return { text: response.text, source: "local" };
}

export default routeChatQuery;
