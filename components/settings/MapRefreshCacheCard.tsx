"use client";

// ---------------------------------------------------------------------
// components/settings/MapRefreshCacheCard.tsx — Map & GIS (Phase 3).
//
// Section 5 · "Auto-Refresh Cadence":
//   • Auto-refresh cadence for live hazard / fleet data.
//   • "Refresh Now" action that pulses a live counter (simulated).
//
// Fully controlled via useMapSettings; the refresh cadence is emitted to
// the central store so the /dashboard map polling loop can honor it.
// Offline tile storage now lives in the dedicated OfflineCacheCard.
// ---------------------------------------------------------------------

import {
  CheckCircle2,
  Database,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { RefreshInterval } from "@/lib/settings/map-settings";

const REFRESH_OPTIONS: { value: RefreshInterval; label: string }[] = [
  { value: "realtime", label: "Realtime (WebSocket)" },
  { value: "off", label: "Off — manual only" },
  { value: "30s", label: "Every 30 seconds" },
  { value: "1m", label: "Every 1 minute" },
  { value: "5m", label: "Every 5 minutes" },
  { value: "15m", label: "Every 15 minutes" },
];

export default function MapRefreshCacheCard() {
  const { settings, update } = useMapSettings();
  const cache = settings.cache;

  function setRefreshInterval(refreshInterval: RefreshInterval) {
    update({ cache: { ...cache, refreshInterval } });
  }

  const interval = cache.refreshInterval === "off"
    ? 0
    : cache.refreshInterval === "realtime"
      ? -1
      : { "30s": 30000, "1m": 60000, "5m": 300000, "15m": 900000 }[
          cache.refreshInterval
        ];
  const isRealtime = interval === -1;

  function handleRefresh() {
    toast.success("Live data refreshed — map layers synced.");
  }

  return (
    <section
      data-settings-key="map-offline"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10">
          <RefreshCw className="h-5 w-5 text-sky-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-sky-300/80">FRESHNESS &amp; SYNC</p>
          <h2 className="mt-0.5 text-lg font-bold">Data Refresh Cadence</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Keep hazard data fresh on the network and keep an offline tile kit
        for field zones with patchy coverage.
      </p>

      {/* Refresh cadence */}
      <div className="mt-5 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Database className="h-3.5 w-3.5" aria-hidden />
          AUTO-REFRESH CADENCE
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {REFRESH_OPTIONS.map((option) => {
            const active = cache.refreshInterval === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRefreshInterval(option.value)}
                aria-pressed={active}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-sky-400/60 bg-sky-500/10 text-sky-200"
                    : "border-panel-border bg-[#0a0f1a] text-slate-400 hover:border-sky-400/40"
                }`}
              >
                {active && (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                )}
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-panel-border pt-3">
          <span className="flex items-center gap-2 text-[11px] text-slate-500">
            <RefreshCw
              className={`h-3.5 w-3.5 ${interval !== 0 ? "animate-spin text-sky-300" : "text-slate-600"}`}
              aria-hidden
            />
            {isRealtime
              ? "Live WebSocket feed — hazard layers update in real time"
              : interval > 0
                ? `Polling live hazard layers every ${cache.refreshInterval}`
                : "Live refresh is manual"}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-md border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Refresh Now
          </button>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Offline tile storage is managed in the{" "}
        <span className="font-semibold text-emerald-300">
          Offline Map Cache Manager
        </span>{" "}
        card below.
      </p>
    </section>
  );
}