"use client";

// ---------------------------------------------------------------------
// components/offline/NetworkStatusWidget.tsx — Phase 7 · Step 5
// The floating "Network Status" widget (Stitch/Antigravity spec).
//
//   • Collapsed pill, bottom-right, z-50:
//       green  "Synced 5 min ago"                — online
//       orange "Offline — Using cached data (2h)"— offline, cache exists
//       red    "Offline — No data available"     — offline, no cache
//   • Click to expand: timestamped sync log
//       "Synced predictions ✓" / "Synced alerts ✓" / "Downloaded map tiles ✓"
//       + a Clear button.
//   • Glassmorphism (translucent backdrop + blur), subtle shadow.
// ---------------------------------------------------------------------

import { useState } from "react";
import { X } from "lucide-react";
import { useNetworkStatus, type NetworkState } from "@/hooks/useNetworkStatus";

const DOT_CLASS: Record<NetworkState, { dot: string; pill: string; ring: string }> = {
  online: {
    dot: "bg-emerald-400",
    pill: "text-emerald-300",
    ring: "ring-emerald-400/40",
  },
  "offline-cached": {
    dot: "bg-amber-400",
    pill: "text-amber-300",
    ring: "ring-amber-400/40",
  },
  "offline-empty": {
    dot: "bg-red-400",
    pill: "text-red-300",
    ring: "ring-red-400/40",
  },
};

export function NetworkStatusWidget() {
  const { state, label, log, clearLog, logRefreshKey } = useNetworkStatus();
  const [open, setOpen] = useState(false);

  const colors = DOT_CLASS[state];

  return (
    <div className="fixed bottom-4 right-4 z-50 hidden md:block">
      <div className="rounded-2xl border border-white/15 bg-white/10 shadow-lg shadow-black/30 backdrop-blur-md">
        {/* Collapsed pill / header */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`Network status: ${label}`}
          className="flex items-center gap-2 rounded-2xl px-3 py-2 transition hover:bg-white/5"
        >
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${colors.dot}`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full ring-2 ${colors.dot} ${colors.ring}`}
            />
          </span>
          <span className={`max-w-[220px] truncate text-[11px] font-bold ${colors.pill}`}>
            {label}
          </span>
        </button>

        {/* Expanded sync log */}
        {open && (
          <div className="border-t border-white/10 px-3 pb-3 pt-2">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/50">
                Sync log
              </p>
              <button
                type="button"
                onClick={clearLog}
                className="text-[9px] font-bold uppercase tracking-wider text-white/40 transition hover:text-white"
              >
                Clear
              </button>
            </div>

            {log.length === 0 ? (
              <p className="py-1 text-[11px] text-white/40">No sync activity yet.</p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto pr-1" key={logRefreshKey}>
                {log.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="text-white/85">{entry.text}</span>
                    <time className="shrink-0 font-mono text-[9px] tabular-nums text-white/40">
                      {new Date(entry.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Close button (dismiss the whole widget) */}
      <button
        type="button"
        aria-label="Close network status widget"
        onClick={() => setOpen(false)}
        className="absolute -right-2 -top-2 hidden rounded-full border border-white/20 bg-black/60 p-1 text-white/60 transition hover:text-white"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

export default NetworkStatusWidget;
