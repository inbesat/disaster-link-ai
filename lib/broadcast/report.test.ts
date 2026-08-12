// ---------------------------------------------------------------------
// lib/broadcast/report.test.ts — Phase 8 · compliance report aggregation.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { aggregateBroadcastReport, type ReportAlertDTO } from "./report";
import type { FmBroadcastLogDTO } from "./types";

const ALERT: ReportAlertDTO = {
  id: "cap-1",
  alertId: "dl-abc-001",
  createdAt: "2026-08-12T10:00:00.000Z",
  language: "hi-IN",
  severity: "Severe",
  district: "Patna",
  disasterType: "flood",
};

function log(overrides: Partial<FmBroadcastLogDTO> = {}): FmBroadcastLogDTO {
  return {
    id: "log-1",
    capAlertId: "cap-1",
    fmStationId: "station-1",
    stationName: "Radio Mirchi 98.3",
    strategy: "cap_api",
    status: "delivered",
    responseCode: 200,
    responseBody: null,
    broadcastTime: "2026-08-12T10:02:30.000Z",
    retryCount: 0,
    externalRef: null,
    createdAt: "2026-08-12T10:02:30.000Z",
    ...overrides,
  };
}

describe("aggregateBroadcastReport (Phase 8)", () => {
  it("counts alerts, stations reached and success rate", () => {
    const report = aggregateBroadcastReport([ALERT], [
      log({ fmStationId: "s1", status: "delivered" }),
      log({ id: "log-2", fmStationId: "s2", status: "delivered" }),
      log({ id: "log-3", fmStationId: "s3", status: "failed" }),
    ]);
    expect(report.totalAlerts).toBe(1);
    expect(report.totalStationsReached).toBe(2);
    expect(report.successRate).toBe(67); // 2 of 3
  });

  it("averages detection→broadcast latency from the first delivered log", () => {
    const report = aggregateBroadcastReport([ALERT], [
      log({ id: "log-slow", fmStationId: "s2", broadcastTime: "2026-08-12T10:10:00.000Z" }),
      log({ id: "log-fast", fmStationId: "s1", broadcastTime: "2026-08-12T10:02:30.000Z" }),
    ]);
    // First delivered = 10:02:30 → 2.5 minutes after alert creation.
    expect(report.avgDetectionToBroadcastMinutes).toBe(2.5);
  });

  it("returns null latency when nothing was delivered", () => {
    const report = aggregateBroadcastReport([ALERT], [
      log({ status: "failed" }),
      log({ id: "log-2", status: "retrying" }),
    ]);
    expect(report.avgDetectionToBroadcastMinutes).toBeNull();
    expect(report.successRate).toBe(0);
    expect(report.totalStationsReached).toBe(0);
  });

  it("breaks languages down by alert count (desc)", () => {
    const report = aggregateBroadcastReport(
      [
        ALERT,
        { ...ALERT, id: "cap-2", language: "hi-IN" },
        { ...ALERT, id: "cap-3", language: "bn-IN" },
      ],
      [],
    );
    expect(report.languageBreakdown).toEqual([
      { language: "hi-IN", alerts: 2 },
      { language: "bn-IN", alerts: 1 },
    ]);
  });

  it("handles empty windows", () => {
    const report = aggregateBroadcastReport([], []);
    expect(report).toEqual({
      totalAlerts: 0,
      totalStationsReached: 0,
      successRate: 0,
      avgDetectionToBroadcastMinutes: null,
      languageBreakdown: [],
    });
  });
});
