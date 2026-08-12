// ---------------------------------------------------------------------
// lib/broadcast/compliance.ts — Phase 8 · Station Compliance Score.
//
// Scores every FM station on its emergency-broadcast reliability so DDMA
// can follow up with the worst offenders. Pure function: stations + their
// broadcast logs in, scores out.
//
// Score (0–100), weighted:
//   60% confirmation rate  — delivered attempts / total attempts
//   20% reliability        — attempts answered with a non-5xx response
//   20% response speed     — avg time from attempt to confirmed delivery
//                             (60 s = full marks, slower decays linearly)
//
// needsFollowUp (< 60) flags stations for DDMA/MIB attention.
// ---------------------------------------------------------------------

import type { FmBroadcastLogDTO } from "./types";

export interface ComplianceStationInput {
  id: string;
  name: string;
}

export type ComplianceTier = "Good" | "Fair" | "Needs follow-up";

export interface StationCompliance {
  stationId: string;
  stationName: string;
  /** 0–100 composite score. */
  score: number;
  tier: ComplianceTier;
  /** 0–1 share of delivered attempts. */
  confirmationRate: number;
  /** 0–1 share of attempts answered with a non-5xx response. */
  reliability: number;
  /** Mean seconds from attempt to delivered broadcast (null when none). */
  avgResponseSeconds: number | null;
  attempts: number;
  delivered: number;
  needsFollowUp: boolean;
}

const WEIGHT_CONFIRMATION = 0.6;
const WEIGHT_RELIABILITY = 0.2;
const WEIGHT_SPEED = 0.2;

/** Response-time benchmark: 60 s is full marks, 0 s floor. */
const SPEED_FULL_MARKS_SECONDS = 60;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function tierForScore(score: number): ComplianceTier {
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  return "Needs follow-up";
}

/** Average response time (attempt → delivered) in seconds, or null. */
function avgResponseSeconds(logs: FmBroadcastLogDTO[]): number | null {
  const latencies: number[] = [];
  for (const log of logs) {
    if (log.status !== "delivered" || !log.broadcastTime) continue;
    const start = new Date(log.createdAt).getTime();
    const end = new Date(log.broadcastTime).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      latencies.push((end - start) / 1000);
    }
  }
  if (latencies.length === 0) return null;
  return Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length);
}

/**
 * Score every station from its broadcast logs. Stations with no logs score
 * near-zero (never demonstrated an emergency feed) and are flagged for
 * follow-up.
 */
export function computeStationCompliance(
  stations: ComplianceStationInput[],
  logs: FmBroadcastLogDTO[],
): StationCompliance[] {
  const logsByStation = new Map<string, FmBroadcastLogDTO[]>();
  for (const log of logs) {
    if (!log.fmStationId) continue;
    const bucket = logsByStation.get(log.fmStationId) ?? [];
    bucket.push(log);
    logsByStation.set(log.fmStationId, bucket);
  }

  const scores = stations.map((station) => {
    const stationLogs = logsByStation.get(station.id) ?? [];
    const attempts = stationLogs.length;
    const delivered = stationLogs.filter((l) => l.status === "delivered").length;
    const non5xx = stationLogs.filter(
      (l) => (l.responseCode ?? 0) < 400,
    ).length;

    const confirmationRate = attempts > 0 ? delivered / attempts : 0;
    const reliability = attempts > 0 ? non5xx / attempts : 0;
    const avgSeconds = avgResponseSeconds(stationLogs);
    const speedScore =
      avgSeconds === null
        ? 50 // no timing data — neutral
        : clamp(100 - (avgSeconds / SPEED_FULL_MARKS_SECONDS) * 100, 0, 100);

    const score = Math.round(
      WEIGHT_CONFIRMATION * confirmationRate * 100 +
        WEIGHT_RELIABILITY * reliability * 100 +
        WEIGHT_SPEED * speedScore,
    );

    return {
      stationId: station.id,
      stationName: station.name,
      score,
      tier: tierForScore(score),
      confirmationRate: Math.round(confirmationRate * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      avgResponseSeconds: avgSeconds,
      attempts,
      delivered,
      needsFollowUp: score < 60,
    };
  });

  // Worst performers first — that's who DDMA must chase.
  return scores.sort((a, b) => a.score - b.score);
}
