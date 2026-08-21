"use client";

// ---------------------------------------------------------------------
// components/admin/broadcast/FmBroadcastMonitor.tsx — Phase 5 · FM
// Broadcast Monitor widget.
//
// Live view of the FM dispatch pipeline for the admin console:
//   • summary cards — stations, latest delivered/failed, IVR calls;
//   • station table — channel badges (cap_api → rds → ftp → email → ivr)
//     with the latest dispatch status per station (green check = confirmed,
//     red = all strategies failed, amber = in flight);
//   • "Force IVR Call" per station — dials the control room via
//     POST /api/broadcast/fm/ivr-fallback;
//   • recent activity feed — the last fm_broadcast_logs rows.
// Auto-refreshes every 10 s; manual refresh button included.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  FlaskConical,
  Loader2,
  PhoneCall,
  Radio,
  RefreshCw,
  XCircle,
} from "lucide-react";
import TestBroadcastModal from "./TestBroadcastModal";

interface StationDTO {
  id: string;
  name: string;
  frequency: string;
  city: string;
  state: string;
  type: string;
  coverageRadiusKm: number;
  emergencyContactPhone: string | null;
  rdsEnabled: boolean;
}

interface LogDTO {
  id: string;
  capAlertId: string | null;
  fmStationId: string | null;
  stationName?: string;
  strategy: string;
  status: string;
  responseCode: number | null;
  responseBody: string | null;
  broadcastTime: string | null;
  retryCount: number;
  externalRef: string | null;
  createdAt: string;
}

const STRATEGY_ORDER = ["cap_api", "rds", "ftp", "email", "ivr"] as const;

const STRATEGY_LABELS: Record<string, string> = {
  cap_api: "API",
  rds: "RDS",
  ftp: "FTP",
  email: "Email",
  ivr: "IVR",
};

type StatusTone = "ok" | "bad" | "pending";

function statusTone(status: string): StatusTone {
  if (status === "delivered") return "ok";
  if (status === "failed") return "bad";
  return "pending"; // sent | retrying
}

function statusBadge(status: string, compact = false) {
  const tone = statusTone(status);
  const base =
    "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider";
  const toneClass =
    tone === "ok"
      ? "bg-emerald-500/10 text-emerald-400"
      : tone === "bad"
        ? "bg-red-500/10 text-red-400"
        : "bg-amber-500/10 text-amber-300";
  const dot =
    tone === "ok" ? (
      <CheckCircle2 className="h-3 w-3" />
    ) : tone === "bad" ? (
      <XCircle className="h-3 w-3" />
    ) : (
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
    );
  return (
    <span className={`${base} ${toneClass}`}>
      {dot}
      {compact ? "" : status}
    </span>
  );
}

function typeBadge(type: string) {
  const cls =
    type === "air"
      ? "border-red-500/40 bg-red-500/10 text-red-400"
      : type === "community"
        ? "border-sky-500/40 bg-sky-500/10 text-sky-400"
        : "border-panel-border bg-primary text-slate-400";
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${cls}`}
    >
      {type === "air" ? "AIR" : type === "community" ? "Community" : "Private"}
    </span>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function FmBroadcastMonitor() {
  const [stations, setStations] = useState<StationDTO[]>([]);
  const [logs, setLogs] = useState<LogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingId, setCallingId] = useState<string | null>(null);
  const [testOpen, setTestOpen] = useState(false);

  const refresh = useCallback(async () => {
    const [stationRes, logRes] = await Promise.all([
      fetch("/api/fm/stations"),
      fetch("/api/broadcast/fm/logs?limit=100"),
    ]);
    const stationData = (await stationRes.json()) as { stations?: StationDTO[] };
    const logData = (await logRes.json()) as { logs?: LogDTO[] };
    setStations(stationData.stations ?? []);
    setLogs(logData.logs ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const logsByStation = useMemo(() => {
    const map = new Map<string, LogDTO[]>();
    for (const log of logs) {
      if (!log.fmStationId) continue;
      const list = map.get(log.fmStationId) ?? [];
      list.push(log);
      map.set(log.fmStationId, list);
    }
    return map;
  }, [logs]);

  /** The most recent capAlertId across all logs (Force IVR target). */
  const latestCapAlertId = useMemo(
    () => logs.find((l) => l.capAlertId)?.capAlertId ?? null,
    [logs],
  );

  const stats = useMemo(() => {
    let delivered = 0;
    let failed = 0;
    let ivr = 0;
    for (const log of logs) {
      if (log.status === "delivered") delivered += 1;
      if (log.status === "failed") failed += 1;
      if (log.strategy === "ivr") ivr += 1;
    }
    return { delivered, failed, ivr };
  }, [logs]);

  async function forceIvr(station: StationDTO) {
    const capAlertId = latestCapAlertId;
    if (!capAlertId) {
      toast.error("No CAP alert available — generate one via the CAP route first.");
      return;
    }
    if (!station.emergencyContactPhone) {
      toast.error(`${station.name} has no emergency contact phone.`);
      return;
    }
    setCallingId(station.id);
    try {
      const res = await fetch("/api/broadcast/fm/ivr-fallback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stationId: station.id, capAlertId }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        callSid?: string;
      };
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "IVR call failed.");
      } else {
        toast.success(`IVR call placed${data.callSid ? ` (${data.callSid})` : ""}.`);
      }
    } catch (error: unknown) {
      console.error("Force IVR failed:", error);
      toast.error("Could not reach the IVR service.");
    } finally {
      setCallingId(null);
      await refresh();
    }
  }

  const cardClass = "rounded-lg border border-panel-border bg-panel p-5";

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cardClass}>
          <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
            <Radio className="h-3 w-3" /> Stations
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">{stations.length}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {stations.filter((s) => s.type === "air").length} AIR · mandatory EWS
          </p>
        </div>
        <div className={cardClass}>
          <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Confirmed
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">{stats.delivered}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            delivered attempts · latest 100 logs
          </p>
        </div>
        <div className={cardClass}>
          <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
            <AlertTriangle className="h-3 w-3 text-red-400" /> Failed
          </p>
          <p className="mt-2 text-2xl font-bold text-red-400">{stats.failed}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            failed attempts — escalation chain
          </p>
        </div>
        <div className={cardClass}>
          <p className="flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
            <PhoneCall className="h-3 w-3 text-amber-400" /> IVR Calls
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-300">{stats.ivr}</p>
          <p className="mt-0.5 text-xs text-slate-500">control-room call attempts</p>
        </div>
      </div>

      {/* --------------------------------------------------- Station grid */}
      <section className={cardClass}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Station Status
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTestOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
              title="Safeguarded dry-run against TEST stations only"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Test Broadcast
            </button>
            <button
              type="button"
              onClick={() => void refresh()}
              className="inline-flex items-center gap-1.5 rounded-md border border-panel-border bg-primary px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-amber-400/50 hover:text-amber-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading && stations.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : stations.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed border-panel-border text-center">
            <Radio className="mb-2 h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-500">No FM stations configured yet.</p>
            <p className="mt-1 text-xs text-slate-600">
              Add stations in FM Stations first.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-panel-border text-[0.6875rem] uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3 font-semibold">Station</th>
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="py-2 pr-3 font-semibold">Channel Chain</th>
                  <th className="py-2 pr-3 font-semibold">Latest Status</th>
                  <th className="py-2 text-right font-semibold">Control Room</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((station) => {
                  const stationLogs = logsByStation.get(station.id) ?? [];
                  const latest = stationLogs[0] ?? null;
                  const chain = STRATEGY_ORDER.filter((s) =>
                    stationLogs.some((l) => l.strategy === s),
                  ).map((s) => stationLogs.find((l) => l.strategy === s) as LogDTO);
                  return (
                    <tr
                      key={station.id}
                      className="border-b border-[#111a2e] transition hover:bg-primary"
                    >
                      <td className="py-2.5 pr-3">
                        <p className="font-semibold text-foreground">{station.name}</p>
                        <p className="text-xs text-slate-500">
                          {station.frequency} · {station.city}, {station.state}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3">{typeBadge(station.type)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {chain.length === 0 ? (
                            <span className="text-xs text-slate-600">—</span>
                          ) : (
                            chain.map((log) => (
                              <span
                                key={log.id}
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[0.625rem] font-semibold ${
                                  statusTone(log.status) === "ok"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                    : statusTone(log.status) === "bad"
                                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                }`}
                              >
                                {STRATEGY_LABELS[log.strategy] ?? log.strategy}
                                {statusTone(log.status) === "ok" && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {statusTone(log.status) === "bad" && (
                                  <XCircle className="h-3 w-3" />
                                )}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        {latest ? (
                          <div className="flex flex-col gap-1">
                            {statusBadge(latest.status)}
                            <span className="text-[0.625rem] text-slate-600">
                              {formatTime(latest.createdAt)} ·{" "}
                              {STRATEGY_LABELS[latest.strategy] ?? latest.strategy}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">Not contacted</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => void forceIvr(station)}
                          disabled={callingId !== null || !station.emergencyContactPhone}
                          title={
                            !station.emergencyContactPhone
                              ? "No control-room phone configured"
                              : "Dial the control room now"
                          }
                          className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {callingId === station.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PhoneCall className="h-3.5 w-3.5" />
                          )}
                          Force IVR
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Safeguarded test broadcast (Phase 9) */}
      <TestBroadcastModal open={testOpen} onClose={() => setTestOpen(false)} />

      {/* --------------------------------------------- Recent activity */}
      <section className={cardClass}>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Recent Dispatch Activity
          </h2>
        </div>
        {logs.length === 0 ? (
          <p className="rounded-md border border-dashed border-panel-border py-8 text-center text-sm text-slate-600">
            No broadcasts yet — dispatch an alert to see activity here.
          </p>
        ) : (
          <ul className="divide-y divide-[#111a2e]">
            {logs.slice(0, 12).map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <span className="min-w-[7rem] truncate text-sm font-medium text-foreground">
                  {log.stationName ?? "Unknown station"}
                </span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${
                    log.strategy === "ivr"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                      : "border-panel-border bg-primary text-slate-400"
                  }`}
                >
                  {STRATEGY_LABELS[log.strategy] ?? log.strategy}
                </span>
                {statusBadge(log.status)}
                {log.retryCount > 0 && (
                  <span className="text-[0.625rem] text-slate-600">
                    attempts ×{log.retryCount + 1}
                  </span>
                )}
                <span className="ml-auto text-[0.6875rem] text-slate-600">
                  {formatTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
