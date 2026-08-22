"use client";

// ---------------------------------------------------------------------
// components/settings/integrations/SystemHealthCard.tsx — Integrations (Phase 8 · Step 9).
//
// External Systems Health (IT ops monitor):
//   • Grid of service tiles — PostgreSQL DB, OpenWeather API, Govt
//     Shelter API, ISRO Bhuvan — each with a pulsing status dot, live
//     label and latency reading (green / amber / red states).
//   • "Run Full Diagnostics" re-probes every service: mock ~1.6s scan,
//     then statuses + latencies re-roll and the summary updates.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity,
  CloudSun,
  Database,
  HeartPulse,
  Loader2,
  Satellite,
  Warehouse,
} from "lucide-react";

type ServiceStatus = "ok" | "degraded" | "offline";

type Service = {
  id: string;
  name: string;
  icon: typeof Database;
  status: ServiceStatus;
  latencyMs: number | null;
};

type RollConfig = { ok: number; degraded: number; offline: number };

const INITIAL_SERVICES: Service[] = [
  { id: "pg", name: "PostgreSQL DB", icon: Database, status: "ok", latencyMs: 12 },
  { id: "openweather", name: "OpenWeather API", icon: CloudSun, status: "ok", latencyMs: 45 },
  {
    id: "govt-shelter",
    name: "Govt Shelter API",
    icon: Warehouse,
    status: "degraded",
    latencyMs: 1200,
  },
  { id: "bhuvan", name: "ISRO Bhuvan", icon: Satellite, status: "offline", latencyMs: null },
];

/** Weighted outcome per service so the demo keeps a healthy mix. */
const ROLLS: Record<string, RollConfig> = {
  pg: { ok: 0.9, degraded: 0.08, offline: 0.02 },
  openweather: { ok: 0.85, degraded: 0.12, offline: 0.03 },
  "govt-shelter": { ok: 0.3, degraded: 0.55, offline: 0.15 },
  bhuvan: { ok: 0.08, degraded: 0.3, offline: 0.62 },
};

const STATUS_META: Record<
  ServiceStatus,
  {
    label: string;
    textClass: string;
    dotClass: string;
    pingClass: string;
    stripClass: string;
    tileClass: string;
  }
> = {
  ok: {
    label: "Operational",
    textClass: "text-emerald-300",
    dotClass: "bg-emerald-400",
    pingClass: "bg-emerald-400/60",
    stripClass: "bg-emerald-400/80",
    tileClass: "border-panel-border bg-surface-muted/40",
  },
  degraded: {
    label: "Degraded",
    textClass: "text-amber-300",
    dotClass: "bg-amber-400",
    pingClass: "bg-amber-400/60",
    stripClass: "bg-amber-400/80",
    tileClass: "border-amber-400/40 bg-amber-500/[0.06]",
  },
  offline: {
    label: "Offline",
    textClass: "text-red-400",
    dotClass: "bg-red-500",
    pingClass: "bg-red-500/60",
    stripClass: "bg-red-500/80",
    tileClass: "border-red-500/40 bg-red-500/[0.06]",
  },
};

function rollStatus(id: string): ServiceStatus {
  const roll = ROLLS[id];
  const r = Math.random();
  if (r < roll.ok) return "ok";
  if (r < roll.ok + roll.degraded) return "degraded";
  return "offline";
}

function rollLatency(status: ServiceStatus): number | null {
  if (status === "offline") return null;
  if (status === "degraded") return Math.round(300 + Math.random() * 1200);
  return Math.round(10 + Math.random() * 70);
}

export default function SystemHealthCard() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [running, setRunning] = useState(false);
  const [lastChecked, setLastChecked] = useState("3 min ago");
  const timerRef = useRef<number | null>(null);

  // Clear any in-flight diagnostics scan on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  function handleDiagnostics() {
    if (running) return;
    setRunning(true);
    timerRef.current = window.setTimeout(() => {
      setServices((prev) =>
        prev.map((service) => {
          const status = rollStatus(service.id);
          return { ...service, status, latencyMs: rollLatency(status) };
        }),
      );
      setRunning(false);
      setLastChecked("just now");
      timerRef.current = null;
      toast.success("Full diagnostics complete — all endpoints re-checked.");
    }, 1600);
  }

  const operational = services.filter((s) => s.status === "ok").length;
  const degraded = services.filter((s) => s.status === "degraded").length;
  const offline = services.filter((s) => s.status === "offline").length;

  return (
    <section
      data-settings-key="integrations-health"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10">
          <HeartPulse className="h-5 w-5 text-rose-300" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="eoc-label text-rose-300/80">EXTERNAL SYSTEMS · OPS MONITOR</p>
          <h2 className="mt-0.5 text-lg font-bold">External Systems Health</h2>
        </div>
        <span className="rounded-full border border-panel-borderHover bg-surface-muted/40 px-2.5 py-1 font-mono text-eoc-tiny font-bold tabular-nums text-slate-400">
          {services.length} services
        </span>
        <button
          type="button"
          onClick={handleDiagnostics}
          disabled={running}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-400/50 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-wait disabled:opacity-60"
        >
          {running ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Running Diagnostics…
            </>
          ) : (
            <>
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Run Full Diagnostics
            </>
          )}
        </button>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Live connectivity and latency probes for every service the command
        center depends on.
      </p>

      {/* Summary strip */}
      <div
        role="status"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-panel-border bg-[#0a0f1a] px-4 py-3"
      >
        <p className="flex items-center gap-2 text-sm text-slate-300">
          <Activity className="h-4 w-4 shrink-0 text-cyan-400" aria-hidden />
          <span className="font-bold tabular-nums">{operational}</span> /{" "}
          {services.length} services operational
          <span className="hidden text-xs text-slate-500 sm:inline">
            · {degraded} degraded · {offline} offline
          </span>
        </p>
        <p className="text-[11px] text-slate-500">Last checked {lastChecked}</p>
      </div>

      {/* Status grid */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((service) => {
          const meta = STATUS_META[service.status];
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              className={`relative overflow-hidden rounded-md border p-4 transition-colors ${meta.tileClass}`}
            >
              {/* Status accent strip */}
              <span
                className={`absolute inset-x-0 top-0 h-0.5 ${meta.stripClass}`}
                aria-hidden="true"
              />

              <div className="flex items-center gap-3">
                <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#1c2740]">
                  <Icon className="h-4 w-4 text-slate-300" aria-hidden />
                  {running ? (
                    <Loader2
                      className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-spin text-cyan-400"
                      aria-hidden
                    />
                  ) : (
                    <>
                      {/* Pulsing status dot */}
                      <span
                        className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-ping rounded-full ${meta.pingClass}`}
                        aria-hidden="true"
                      />
                      <span
                        className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${meta.dotClass}`}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-100">
                    {service.name}
                  </p>
                  <p className={`text-[11px] font-semibold ${meta.textClass}`}>
                    {meta.label}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="font-mono text-xs tabular-nums text-slate-400">
                  {service.latencyMs === null ? (
                    <span className="text-red-400/90">No response</span>
                  ) : (
                    <>
                      {service.latencyMs}ms{" "}
                      <span className="text-slate-600">latency</span>
                    </>
                  )}
                </p>
                {running && (
                  <span className="text-eoc-tiny font-bold uppercase tracking-wider text-cyan-400/80">
                    checking…
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic attention note */}
      <p className="mt-4 flex items-center gap-2 text-xs">
        {offline > 0 ? (
          <>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" aria-hidden />
            <span className="text-red-300/90">
              {offline} service{offline > 1 ? "s are" : " is"} offline — check the
              incident channel before the next alert cycle.
            </span>
          </>
        ) : degraded > 0 ? (
          <>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" aria-hidden />
            <span className="text-amber-300/90">
              {degraded} service{degraded > 1 ? "s are" : " is"} degraded — latency
              is elevated but traffic still flows.
            </span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
            <span className="text-emerald-300/90">All systems operational.</span>
          </>
        )}
      </p>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <HeartPulse className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Demo fixtures — probes are simulated and re-rolled on every
        diagnostics run.
      </p>
    </section>
  );
}
