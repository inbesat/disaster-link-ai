// ---------------------------------------------------------------------
// lib/broadcast/history.ts — Phase 8 · shared broadcast-history loader.
//
// One query + mapping used by BOTH /api/broadcast/fm/history (the admin
// table) and /api/broadcast/fm/export/pdf (the DDMA/MIB print report),
// so the two routes can never drift apart. Also carries the clearly-
// stamped demo rows used when the database is unreachable.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";

/** One station delivery attempt (per-station broadcast certificate row). */
export interface BroadcastDeliveryRow {
  stationName: string;
  strategy: string;
  status: string;
  responseCode: number | null;
  responseBody: string | null;
  broadcastTime: string | null;
  retryCount: number;
  externalRef: string | null;
}

/** One CAP alert with its per-station deliveries (history table row). */
export interface BroadcastHistoryRow {
  id: string;
  alertId: string;
  capHash: string | null;
  createdAt: string;
  language: string | null;
  severity: string | null;
  status: string;
  audioUrl: string | null;
  district: string | null;
  disasterType: string | null;
  stationsReached: number;
  failed: number;
  deliveries: BroadcastDeliveryRow[];
}

export interface HistoryQuery {
  start: Date;
  end: Date;
  district?: string;
  disasterType?: string;
  status?: string;
}

/**
 * Load CAP alerts + their delivery logs for a window, mapped to plain
 * rows. Bounded (1000) so archive queries stay predictable.
 */
export async function loadBroadcastHistoryRows(
  query: HistoryQuery,
): Promise<BroadcastHistoryRow[]> {
  const alerts = await prisma.capAlert.findMany({
    where: {
      createdAt: { gte: query.start, lte: query.end },
      ...(query.district
        ? { disasterEvent: { is: { district: { contains: query.district } } } }
        : {}),
      ...(query.disasterType
        ? { disasterEvent: { is: { type: query.disasterType } } }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    },
    include: {
      disasterEvent: { select: { district: true, type: true } },
      broadcastLogs: {
        include: { fmStation: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  return alerts.map((alert) => {
    const delivered = alert.broadcastLogs.filter((l) => l.status === "delivered");
    const failed = alert.broadcastLogs.filter((l) => l.status === "failed");
    return {
      id: alert.id,
      alertId: alert.alertId,
      capHash: alert.capHash,
      createdAt: alert.createdAt.toISOString(),
      language: alert.language,
      severity: alert.severity,
      status: alert.status,
      audioUrl: alert.audioUrl,
      district: alert.disasterEvent?.district ?? null,
      disasterType: alert.disasterEvent?.type ?? null,
      stationsReached: delivered.length,
      failed: failed.length,
      deliveries: alert.broadcastLogs.map((log) => ({
        stationName: log.fmStation?.name ?? "Unknown station",
        strategy: log.strategy,
        status: log.status,
        responseCode: log.responseCode,
        responseBody: log.responseBody,
        broadcastTime: log.broadcastTime?.toISOString() ?? null,
        retryCount: log.retryCount,
        externalRef: log.externalRef,
      })),
    };
  });
}

/** 64-char hex (real SHA-256 digests) so demo certificates look valid. */
const DEMO_HASH_A =
  "3f7a9c2e8b1d4f6a0c5e9b7d2f4a6c8e1b3d5f7a9c2e8b1d4f6a0c5e9b7d2f4a6";
const DEMO_HASH_B =
  "b4e8f1a3c5d7e9b2f4a6c8e1b3d5f7a9c2e8b1d4f6a0c5e9b7d2f4a6c8e1b3d5f7";

/**
 * Seeded sample rows for the DB-less demo path (the caller stamps them
 * DEMO). Frequencies/stations match the seeded FM station list.
 */
export function demoHistoryRows(): BroadcastHistoryRow[] {
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString();
  return [
    {
      id: "demo-1",
      alertId: "dl-demo-001-mzk4x",
      capHash: DEMO_HASH_A,
      createdAt: iso(35),
      language: "hi-IN",
      severity: "Extreme",
      status: "delivered",
      audioUrl: null,
      district: "Patna",
      disasterType: "flood",
      stationsReached: 4,
      failed: 1,
      deliveries: [
        {
          stationName: "AIR Patna FM",
          strategy: "cap_api",
          status: "delivered",
          responseCode: 200,
          responseBody: '{"accepted":true}',
          broadcastTime: iso(32),
          retryCount: 0,
          externalRef: null,
        },
        {
          stationName: "Radio Mirchi 98.3",
          strategy: "rds",
          status: "delivered",
          responseCode: 200,
          responseBody: "confirmed:live",
          broadcastTime: iso(31),
          retryCount: 0,
          externalRef: null,
        },
        {
          stationName: "Red FM Patna",
          strategy: "email",
          status: "delivered",
          responseCode: 202,
          responseBody: "queued for studio playback",
          broadcastTime: iso(29),
          retryCount: 1,
          externalRef: null,
        },
        {
          stationName: "Radio City Patna",
          strategy: "ivr",
          status: "delivered",
          responseCode: 201,
          responseBody: "IVR call placed",
          broadcastTime: iso(28),
          retryCount: 0,
          externalRef: "CA-demo-7f3a",
        },
        {
          stationName: "Radio Nasha Patna",
          strategy: "ftp",
          status: "failed",
          responseCode: 530,
          responseBody: "login authentication failed",
          broadcastTime: null,
          retryCount: 3,
          externalRef: null,
        },
      ],
    },
    {
      id: "demo-2",
      alertId: "dl-demo-002-a9q2p",
      capHash: DEMO_HASH_B,
      createdAt: iso(220),
      language: "bn-IN",
      severity: "Severe",
      status: "delivered",
      audioUrl: null,
      district: "Malda",
      disasterType: "flood",
      stationsReached: 3,
      failed: 0,
      deliveries: [
        {
          stationName: "AIR Malda FM",
          strategy: "cap_api",
          status: "delivered",
          responseCode: 200,
          responseBody: '{"accepted":true}',
          broadcastTime: iso(217),
          retryCount: 0,
          externalRef: null,
        },
        {
          stationName: "Radio Mirchi Malda",
          strategy: "rds",
          status: "delivered",
          responseCode: 200,
          responseBody: "echo ok",
          broadcastTime: iso(216),
          retryCount: 0,
          externalRef: null,
        },
        {
          stationName: "Red FM Malda",
          strategy: "email",
          status: "delivered",
          responseCode: 202,
          responseBody: "accepted",
          broadcastTime: iso(214),
          retryCount: 0,
          externalRef: null,
        },
      ],
    },
  ];
}
