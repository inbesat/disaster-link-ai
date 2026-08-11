"use client";

// ---------------------------------------------------------------------
// components/public/BatterySaverBanner.tsx — Phase 13 · Step 8 · Hardware
// Battery Optimization.
//
// Renders a yellow "Battery Saver Active" banner at the top of the
// Citizen Dashboard when the device drops below 20% charge. While it's
// shown, background auto-refresh timers are paused (SafetyTipsFeed skips
// its rotation) and the citizen refreshes manually via pull-to-refresh —
// a dead phone is deadly, so every wake-up saved matters.
//
// Renders nothing when the Battery API is unavailable or the charge is
// healthy, so it can be mounted unconditionally.
// ---------------------------------------------------------------------

import { BatteryLow, RefreshCw } from "lucide-react";
import { useBatterySaver } from "@/hooks/useBatterySaver";

export function BatterySaverBanner() {
  const { isBatteryLow, level, charging, supported } = useBatterySaver();
  if (!supported || !isBatteryLow) return null;

  const percent = Math.round(level * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3.5 py-2.5 backdrop-blur"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/20 ring-1 ring-amber-400/40">
        <BatteryLow aria-hidden="true" className="h-5 w-5 text-amber-300" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-bold leading-snug text-amber-100">
          🔋 Battery Saver Active. Background sync disabled.
        </p>
        <p className="mt-0.5 flex items-center gap-1 text-[0.6875rem] font-medium text-amber-200/80">
          <RefreshCw aria-hidden="true" className="h-3 w-3" />
          {percent}%{charging ? " · charging" : ""} — pull down to refresh for
          updates
        </p>
      </div>
    </div>
  );
}

export default BatterySaverBanner;
