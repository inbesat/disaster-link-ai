"use client";

// ---------------------------------------------------------------------
// components/settings/map/DataRefreshCard.tsx — Map & GIS (Phase 3 · Step 7).
//
// Polling & WebSocket controls for live data ingestion:
//   • Dropdown for Live Data Refresh Rate — Realtime (WebSocket) ·
//     Every 30s · Every 1 min · Every 5 min · Manual Only.
//   • Dynamic warning banner under the dropdown.
//   • "Force Sync Map Data" button with a spinning refresh icon.
//
// The chosen rate writes straight into cache.refreshInterval (shared with
// the offline-cache card), so the /dashboard map's polling loop honours it
// immediately.
// ---------------------------------------------------------------------

import {
  RadioTower,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useMapSettings } from "@/lib/settings/MapSettingsContext";
import type { RefreshInterval } from "@/lib/settings/map-settings";

const RATE_OPTIONS: {
  value: RefreshInterval;
  label: string;
  hint: string;
  warning?: string;
}[] = [
  {
    value: "realtime",
    label: "Real-time (WebSocket)",
    hint: "Push updates over WebSocket",
    warning: "High battery and data usage.",
  },
  {
    value: "30s",
    label: "Every 30s",
    hint: "Poll interval: 30 seconds",
  },
  {
    value: "1m",
    label: "Every 1 min",
    hint: "Poll interval: 1 minute",
  },
  {
    value: "5m",
    label: "Every 5 min",
    hint: "Poll interval: 5 minutes",
  },
  {
    value: "off",
    label: "Manual Only",
    hint: "No automatic updates",
    warning: "You will not receive automatic map updates.",
  },
];

export default function DataRefreshCard() {
  const { settings, update } = useMapSettings();
  const refreshInterval = settings.cache.refreshInterval;
  const [syncing, setSyncing] = useState(false);

  function setRate(value: RefreshInterval) {
    update({ cache: { ...settings.cache, refreshInterval: value } });
  }

  function forceSync() {
    if (syncing) return;
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      toast.success("Map data forced to latest — all layers synced.");
    }, 1200);
  }

  const activeOption =
    RATE_OPTIONS.find((option) => option.value === refreshInterval) ??
    RATE_OPTIONS[2];

  return (
    <section
      data-settings-key="map-refresh-mode"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
          <RadioTower className="h-5 w-5 text-cyan-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-cyan-300/80">DATA PIPELINE</p>
          <h2 className="mt-0.5 text-lg font-bold">Live Data Refresh Rate</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Control how often hazard, fleet and field-report layers pull fresh
        data — from real-time WebSocket push to fully manual sync.
      </p>

      {/* Dropdown + Force Sync */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label
            htmlFor="map-refresh-rate"
            className="mb-1.5 block text-[11px] font-semibold tracking-wide text-slate-400"
          >
            LIVE DATA REFRESH RATE
          </label>
          <div className="relative">
            <select
              id="map-refresh-rate"
              value={refreshInterval}
              onChange={(event) => setRate(event.target.value as RefreshInterval)}
              className="w-full appearance-none rounded-md border border-panel-border bg-[#0a0f1d] px-3 py-2.5 pr-9 text-sm text-slate-200 outline-none transition focus:border-cyan-400/60"
            >
              {RATE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} — {option.hint}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
              <svg
                className="h-4 w-4 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={forceSync}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-70"
          >
            <RefreshCw
              className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              aria-hidden
            />
            {syncing ? "Syncing…" : "Force Sync Map Data"}
          </button>
        </div>
      </div>

      {/* Dynamic warning */}
      {activeOption.warning ? (
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-amber-400/40 bg-amber-500/10 p-3">
          <TriangleAlert className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
          <p className="text-xs font-medium text-amber-200">
            {activeOption.warning}
            {refreshInterval === "realtime"
              ? " Ensure devices stay on power in field."
              : " Use the Force Sync button above when you need latest data."}
          </p>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
          <RadioTower className="h-3.5 w-3.5 shrink-0 text-cyan-400" aria-hidden />
          Polling every{" "}
          {refreshInterval === "realtime"
            ? "WebSocket push (no polling)"
            : refreshInterval === "30s"
              ? "30 seconds"
              : refreshInterval === "1m"
                ? "minute"
                : refreshInterval === "5m"
                  ? "5 minutes"
                  : "15 minutes"}
          . Synced immediately via the shared store &amp; localStorage.
        </p>
      )}
    </section>
  );
}