// ---------------------------------------------------------------------
// lib/broadcast/fm-dispatcher.ts — Phase 4 · multi-strategy FM dispatcher.
//
// dispatchToStations(disasterEventId) drives the full broadcast pipeline:
//
//   1. Load the DisasterEvent + the CapAlert produced for it.
//   2. Find the FM stations whose coverage reaches the disaster zone
//      (Phase 1 geospatial lookup; district-centroid fallback).
//   3. Reuse the generated CAP XML + voiced MP3 (Phases 2–3).
//   4. Pick the best strategy per station (cap_api → rds → ftp → email).
//   5. Dispatch every station in parallel (Promise.allSettled).
//   6. Log each attempt to fm_broadcast_logs.
//   7. Retry failed stations (max 3 attempts, 2-minute backoff).
//
// When `testMode` is set, the dispatcher refuses real outbound calls and
// records deterministic "dry-run" results so a safety check can be
// rehearsed end-to-end without broadcasting.
// ---------------------------------------------------------------------

import { prisma } from "@/server/prisma";
import type {
  CapAlert,
  DisasterEvent,
  FmStation,
  Prisma,
} from "@prisma/client";
import { findStationsInRadius } from "@/lib/fm/find-stations";
import { CapApiStrategy } from "@/lib/broadcast/strategies/cap-api";
import { RdsPushStrategy } from "@/lib/broadcast/strategies/rds-push";
import { FtpDropStrategy } from "@/lib/broadcast/strategies/ftp-drop";
import { EmailStudioStrategy } from "@/lib/broadcast/strategies/email-studio";
import { buildRdsText } from "@/lib/broadcast/rds-text";
import { selectBestStrategy } from "@/lib/broadcast/strategy-selector";
import type {
  DispatchContext,
  DispatchResult,
  DispatchStrategyName,
  FMDispatchStrategy,
  FmBroadcastLogDTO,
} from "@/lib/broadcast/types";

// Re-export pure helpers used by callers/tests.
export { isUsableUrl } from "@/lib/broadcast/strategies/cap-api";
export { parseFtpUrl, type FtpCredentials } from "@/lib/broadcast/strategies/ftp-drop";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2 * 60 * 1000;

/** District centroids for the "stations in radius" fallback (WGS84). */
const DISTRICT_CENTROIDS: Record<string, [number, number]> = {
  patna: [85.14, 25.59],
  puri: [85.82, 19.8],
  bihar: [85.31, 25.1],
  odisha: [84.35, 20.4],
  bhagalpur: [86.98, 25.24],
  muzaffarpur: [85.39, 26.12],
  munger: [86.47, 25.38],
  darbhanga: [85.9, 26.15],
  chennai: [80.27, 13.08],
  bengaluru: [77.59, 12.97],
  mumbai: [72.88, 19.08],
  kolkata: [88.36, 22.57],
};

/** A single station's dispatch attempt result (for the route response). */
export interface StationDispatchResult {
  stationId: string;
  stationName: string;
  frequency: string;
  strategy: DispatchStrategyName;
  ok: boolean;
  attempts: number;
  status: string;
  responseCode: number | null;
  responseBody: string | null;
  broadcastTime: string | null;
}

export interface DispatchReport {
  dispatched: number;
  failed: number;
  testMode: boolean;
  stations: StationDispatchResult[];
  capAlertId: string | null;
}

interface DispatchOptions {
  /** When set, no real outbound calls are made. */
  testMode?: boolean;
  /** Retry schedule override (tests / local demo). */
  retryDelayMs?: number;
  maxAttempts?: number;
}

/**
 * Dispatch a CAP alert for a disaster event to every covering FM station.
 * Returns a summary report; each station's attempts are logged to
 * fm_broadcast_logs.
 */
export async function dispatchToStations(
  disasterEventId: string,
  options: DispatchOptions = {},
): Promise<DispatchReport> {
  const testMode = options.testMode ?? false;
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const retryDelayMs = options.retryDelayMs ?? RETRY_DELAY_MS;

  // 1. Load the event + its CAP alert (Phases 2–3 outputs).
  const [event, capAlerts] = await Promise.all([
    prisma.disasterEvent.findUnique({ where: { id: disasterEventId } }),
    prisma.capAlert.findMany({
      where: { disasterEventId },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
  ]);
  if (!event) throw new Error("Disaster event not found.");
  const capAlert = capAlerts[0];
  if (!capAlert) {
    throw new Error(
      "No CAP alert exists for this event — generate one via POST /api/cap/generate first.",
    );
  }

  // 2. Resolve the affected-point + radio-ready context.
  const context = await buildDispatchContext(event, capAlert);

  // 4. Find covering stations.
  const stations = await findCoveringStations(event);

  // Assemble the strategy set (kept instance-level for test seam).
  const strategies = defaultStrategies();

  const report: DispatchReport = {
    dispatched: 0,
    failed: 0,
    testMode,
    stations: [],
    capAlertId: capAlert.id,
  };

  // 5–7. Dispatch in parallel, retry failed ones.
  for (const station of stations) {
    const strategy = selectBestStrategy(station, strategies);
    if (!strategy) continue;

    let last: DispatchResult | null = null;
    let attempt = 0;
    while (attempt < maxAttempts) {
      attempt += 1;
      last = await dispatchAttempt(station, strategy, context, {
        testMode,
        attempt,
      });
      if (last.ok) break;
      if (attempt < maxAttempts) {
        await delay(retryDelayMs);
      }
    }
    if (!last) continue;

    const stationResult: StationDispatchResult = {
      stationId: station.id,
      stationName: station.name,
      frequency: station.frequency,
      strategy: last.strategy,
      ok: last.ok,
      attempts: attempt,
      status: last.ok ? "delivered" : "failed",
      responseCode: last.responseCode,
      responseBody: last.responseBody,
      broadcastTime: last.broadcastTime ?? null,
    };
    report.stations.push(stationResult);
    if (last.ok) report.dispatched += 1;
    else report.failed += 1;
  }

  return report;
}

/** Wrapper that logs every attempt regardless of outcome. */
async function dispatchAttempt(
  station: FmStation,
  strategy: FMDispatchStrategy,
  context: DispatchContext,
  opts: { testMode: boolean; attempt: number },
): Promise<DispatchResult> {
  const result = opts.testMode
    ? dryRunResult(strategy, station)
    : await strategy.send(station, context);

  void writeLog(station, context.capAlert.id, strategy.name, result, {
    retryCount: opts.attempt - 1,
    testMode: opts.testMode,
  });
  return result;
}

/** Deterministic result for testMode (no outbound calls). */
function dryRunResult(
  strategy: FMDispatchStrategy,
  _station: FmStation,
): DispatchResult {
  const detail = describeChannel(strategy);
  return {
    ok: true,
    strategy: strategy.name,
    responseCode: 200,
    responseBody: `[dry-run] ${_station.name} would receive the broadcast via ${detail}.`,
  };
}

function describeChannel(strategy: FMDispatchStrategy): string {
  switch (strategy.name) {
    case "cap_api":
      return "CAP API push";
    case "rds":
      return "RDS text scrolling";
    case "ftp":
      return "FTP audio drop";
    case "email":
      return "studio email";
    default:
      return "IVR callback";
  }
}

async function writeLog(
  station: FmStation,
  capAlertId: string,
  strategy: DispatchStrategyName,
  result: DispatchResult,
  opts: { retryCount: number; testMode: boolean },
): Promise<void> {
  try {
    await prisma.fmBroadcastLog.create({
      data: {
        capAlertId,
        fmStationId: station.id,
        strategy,
        status: result.ok ? "delivered" : "failed",
        responseCode: result.responseCode,
        responseBody: result.responseBody?.slice(0, 2000) ?? null,
        broadcastTime: result.broadcastTime ? new Date(result.broadcastTime) : null,
        retryCount: opts.retryCount,
        testMode: opts.testMode,
      },
    });
  } catch (error) {
    console.error("[broadcast] Failed to write fm_broadcast_log:", error);
  }
}

/** Resolve station coverage for the event (district centroid fallback). */
async function findCoveringStations(event: DisasterEvent): Promise<FmStation[]> {
  const stations = await prisma.fmStation.findMany({
    where: { isActive: true },
  });

  // Prefer the district string when we can't read the PostGIS epicenter.
  const districtKey = (event.district ?? "").trim().toLowerCase();
  const centroid = DISTRICT_CENTROIDS[districtKey];
  if (!centroid) return stations; // no geometry signal — all active stations

  const plain = stations.map((s) => ({
    ...s,
    lat: s.lat !== null ? Number(s.lat) : null,
    lng: s.lng !== null ? Number(s.lng) : null,
  }));

  const matched = findStationsInRadius(centroid[1], centroid[0], plain, 50);
  const matchedIds = new Set(matched.map((s) => s.id));
  return stations.filter((s) => matchedIds.has(s.id));
}

/** Assemble the shared broadcast context (script + RDS text + buffers). */
async function buildDispatchContext(
  event: DisasterEvent,
  capAlert: CapAlert,
): Promise<DispatchContext> {
  const { headline, instruction, script } = parseCap(capAlert.capXml);

  const rdsText = buildRdsText({
    event: event.type || "Emergency",
    district: event.district ?? "",
    headline,
    instruction,
    script,
  });

  // Audio bytes: fetch the stored MP3 when available (data-URIs skipped).
  let audioBuffer = Buffer.alloc(0);
  if (capAlert.audioUrl && !capAlert.audioUrl.startsWith("data:")) {
    try {
      const remote = await fetch(capAlert.audioUrl, {
        signal: AbortSignal.timeout(10_000),
      });
      if (remote.ok) {
        audioBuffer = Buffer.from(await remote.arrayBuffer());
      }
    } catch (error) {
      console.error("[broadcast] Failed to fetch stored audio:", error);
    }
  }

  return {
    capAlert,
    audioBuffer,
    alertId: capAlert.alertId,
    headline,
    rdsText,
  };
}

/** Pull headline/instruction/description out of the CAP XML. */
function parseCap(capXml: string): {
  headline: string;
  instruction: string;
  script: string;
} {
  const get = (tag: string) => {
    const match = capXml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
    return match ? match[1] : "";
  };
  return {
    headline: get("headline") || "Emergency Alert",
    instruction: get("instruction"),
    script: get("description"),
  };
}

/** The default strategy registry (also used by the route for inspection). */
export function defaultStrategies(): FMDispatchStrategy[] {
  return [
    new CapApiStrategy(),
    new RdsPushStrategy(),
    new FtpDropStrategy(),
    new EmailStudioStrategy(),
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Serialize a broadcast log row for API responses. */
export function serializeBroadcastLog(
  row: Prisma.FmBroadcastLogGetPayload<{ include: { fmStation: true } }>,
): FmBroadcastLogDTO {
  return {
    id: row.id,
    capAlertId: row.capAlertId,
    fmStationId: row.fmStationId,
    stationName: row.fmStation?.name,
    strategy: row.strategy,
    status: row.status,
    responseCode: row.responseCode,
    responseBody: row.responseBody,
    broadcastTime: row.broadcastTime?.toISOString() ?? null,
    retryCount: row.retryCount,
    createdAt: row.createdAt.toISOString(),
  };
}