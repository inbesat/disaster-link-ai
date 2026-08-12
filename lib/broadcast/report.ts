// ---------------------------------------------------------------------
// lib/broadcast/report.ts — Phase 8 · broadcast compliance report.
//
// Pure aggregation for /api/broadcast/fm/report. Everything it needs is
// passed in (cap-alert rows + broadcast-log rows), so the maths is fully
// unit-tested and the route stays a thin DB wrapper.
// ---------------------------------------------------------------------

import type { FmBroadcastLogDTO } from "./types";

/** Cap-alert row shape the report consumes (district/type via the event). */
export interface ReportAlertDTO {
  id: string;
  alertId: string;
  createdAt: string; // ISO — the detection/approval moment
  language: string | null;
  severity: string | null;
  district: string | null;
  disasterType: string | null;
}

export interface BroadcastReport {
  /** Total CAP alerts broadcast in the window. */
  totalAlerts: number;
  /** Distinct stations that delivered at least one broadcast. */
  totalStationsReached: number;
  /** % of broadcast attempts that were delivered (0–100). */
  successRate: number;
  /** Mean minutes from alert creation to first delivered broadcast. */
  avgDetectionToBroadcastMinutes: number | null;
  /** Alerts per language (desc). */
  languageBreakdown: Array<{ language: string; alerts: number }>;
}

/**
 * Aggregate alerts + logs into a DDMA/MIB-style compliance report.
 * Latency uses the first *delivered* attempt per alert (a failed CAP API
 * push that then succeeds via FTP still counts as delivered).
 */
export function aggregateBroadcastReport(
  alerts: ReportAlertDTO[],
  logs: FmBroadcastLogDTO[],
): BroadcastReport {
  const attempts = logs.length;
  const delivered = logs.filter((l) => l.status === "delivered");
  const successRate = attempts > 0 ? Math.round((delivered.length / attempts) * 100) : 0;

  const stationsReached = new Set(
    delivered.map((l) => l.fmStationId).filter((id): id is string => Boolean(id)),
  );

  // First delivered broadcast per alert (by broadcastTime, else log time).
  const deliveredByAlert = new Map<string, FmBroadcastLogDTO[]>();
  for (const log of delivered) {
    if (!log.capAlertId) continue;
    const bucket = deliveredByAlert.get(log.capAlertId) ?? [];
    bucket.push(log);
    deliveredByAlert.set(log.capAlertId, bucket);
  }

  const latencies: number[] = [];
  for (const alert of alerts) {
    const bucket = deliveredByAlert.get(alert.id);
    if (!bucket?.length) continue;
    const first = bucket.reduce((a, b) => {
      const ta = b.broadcastTime ?? b.createdAt;
      const tb = a.broadcastTime ?? a.createdAt;
      return ta < tb ? b : a;
    });
    const start = new Date(alert.createdAt).getTime();
    const end = new Date(first.broadcastTime ?? first.createdAt).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      latencies.push((end - start) / 60_000);
    }
  }
  const avgDetectionToBroadcastMinutes =
    latencies.length > 0
      ? Math.round((latencies.reduce((sum, v) => sum + v, 0) / latencies.length) * 10) / 10
      : null;

  const languageCounts = new Map<string, number>();
  for (const alert of alerts) {
    const lang = alert.language ?? "unknown";
    languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
  }
  const languageBreakdown = Array.from(languageCounts.entries())
    .map(([language, count]) => ({ language, alerts: count }))
    .sort((a, b) => b.alerts - a.alerts);

  return {
    totalAlerts: alerts.length,
    totalStationsReached: stationsReached.size,
    successRate,
    avgDetectionToBroadcastMinutes,
    languageBreakdown,
  };
}
