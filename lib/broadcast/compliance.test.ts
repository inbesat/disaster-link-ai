// ---------------------------------------------------------------------
// lib/broadcast/compliance.test.ts — Phase 8 · Station Compliance Score.
// ---------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { computeStationCompliance, tierForScore } from "./compliance";
import type { FmBroadcastLogDTO } from "./types";

const STATIONS = [
  { id: "s1", name: "AIR Patna" },
  { id: "s2", name: "Radio Mirchi 98.3" },
  { id: "s3", name: "Radio Mantra 90.4" },
];

function log(
  stationId: string,
  overrides: Partial<FmBroadcastLogDTO> = {},
): FmBroadcastLogDTO {
  return {
    id: `log-${stationId}-${Math.random()}`,
    capAlertId: "cap-1",
    fmStationId: stationId,
    stationName: stationId,
    strategy: "cap_api",
    status: "delivered",
    responseCode: 200,
    responseBody: null,
    broadcastTime: "2026-08-12T10:02:30.000Z",
    retryCount: 0,
    externalRef: null,
    createdAt: "2026-08-12T10:02:00.000Z",
    ...overrides,
  };
}

describe("tierForScore", () => {
  it("maps scores to Good / Fair / Needs follow-up", () => {
    expect(tierForScore(90)).toBe("Good");
    expect(tierForScore(80)).toBe("Good");
    expect(tierForScore(70)).toBe("Fair");
    expect(tierForScore(60)).toBe("Fair");
    expect(tierForScore(42)).toBe("Needs follow-up");
  });
});

describe("computeStationCompliance (Phase 8)", () => {
  it("scores a flawless station Good and an inactive one Needs follow-up", () => {
    const scores = computeStationCompliance(STATIONS, [
      // s1: 3/3 delivered, all 2xx, fast (30 s response)
      log("s1", { createdAt: "2026-08-12T10:02:00.000Z", broadcastTime: "2026-08-12T10:02:30.000Z" }),
      log("s1", { id: "a2", createdAt: "2026-08-12T11:00:00.000Z", broadcastTime: "2026-08-12T11:00:20.000Z" }),
      log("s1", { id: "a3", createdAt: "2026-08-12T12:00:00.000Z", broadcastTime: "2026-08-12T12:00:40.000Z" }),
      // s3: failed attempt with a 500
      log("s3", { status: "failed", responseCode: 500, broadcastTime: null }),
    ]);

    const byId = new Map(scores.map((s) => [s.stationId, s]));
    const s1 = byId.get("s1")!;
    // 60 (confirmation) + 20 (reliability) + 10 (30 s avg speed) = 90.
    expect(s1.score).toBe(90);
    expect(s1.tier).toBe("Good");
    expect(s1.needsFollowUp).toBe(false);
    expect(s1.avgResponseSeconds).toBe(30);

    const s2 = byId.get("s2")!;
    // No logs: 0 confirmation + 0 reliability + 10 neutral speed = 10 —
    // still far below the 60 follow-up threshold.
    expect(s2.score).toBe(10);
    expect(s2.tier).toBe("Needs follow-up");
    expect(s2.needsFollowUp).toBe(true);

    const s3 = byId.get("s3")!;
    expect(s3.needsFollowUp).toBe(true);
    expect(s3.reliability).toBe(0); // 500 is a failed (5xx) response
  });

  it("sorts worst-first for DDMA follow-up", () => {
    const scores = computeStationCompliance(STATIONS, [
      log("s1"),
      log("s1", { id: "b2" }),
      log("s3", { status: "failed", responseCode: 500, broadcastTime: null }),
    ]);
    const order = scores.map((s) => s.stationId);
    expect(order[0]).toBe("s2"); // no logs — worst
    expect(order[1]).toBe("s3"); // failed attempt — second worst
    expect(order[2]).toBe("s1"); // clean record
  });

  it("treats dry-run (test mode) successes as delivered", () => {
    const scores = computeStationCompliance(STATIONS, [
      log("s1", { strategy: "rds", responseBody: "[dry-run]" }),
    ]);
    expect(scores.find((s) => s.stationId === "s1")!.delivered).toBe(1);
  });
});
