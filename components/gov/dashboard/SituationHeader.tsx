"use client";

// ---------------------------------------------------------------------
// components/gov/dashboard/SituationHeader.tsx — Phase 7 · Step 2 ·
// Situation Awareness Header.
//
// The persistent top bar that gives commanders instant global context on
// every gov dashboard screen:
//
//   • Left   — "District Context" dropdown selector (Patna / Ernakulam /
//              Kamrup) — the same accessible listbox pattern as the
//              command center's DashboardHeader.
//   • Right  — a row of 4 mini-stat counters, each with a pulsing live
//              dot: 3 Active Events · ▲ 12k At Risk · 45 Responders
//              Online · ▲ 2 Pending Alerts.
//   • "Last synced: Just now" — a relative timestamp that re-syncs (and
//              blinks) every 30 seconds, so the bar always reads live.
//
// The selected district is local state for now; later Phase 7 steps lift
// it into a shared context so the whole grid reacts to a switch.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ChevronDown, MapPin } from "lucide-react";
import PresenceBar from "@/components/gov/dashboard/PresenceBar";

/** Districts the gov command center can switch between. */
export const GOV_DISTRICTS = ["Patna", "Ernakulam", "Kamrup"] as const;

/** How often the sync line re-syncs (and blinks). */
const SYNC_MS = 30_000;
/** Relative label threshold — under this it reads "Just now". */
const JUST_NOW_MS = 3000;

type Stat = {
  label: string;
  value: string;
  /** Show the ▲ trend glyph before the value. */
  trend?: boolean;
  dot: string;
  tone: string;
};

const STATS: Stat[] = [
  {
    label: "Active Events",
    value: "3",
    dot: "bg-severity-red-500",
    tone: "text-severity-red-300",
  },
  {
    label: "At Risk",
    value: "12k",
    trend: true,
    dot: "bg-severity-amber-500",
    tone: "text-severity-amber-300",
  },
  {
    label: "Responders Online",
    value: "45",
    dot: "bg-severity-green-500",
    tone: "text-severity-green-300",
  },
  {
    label: "Pending Alerts",
    value: "2",
    trend: true,
    dot: "bg-[var(--dl-blue)]",
    tone: "text-[var(--dl-blue-light)]",
  },
];

/** Accessible district dropdown — button + floating listbox (same pattern
 * as DashboardHeader's DistrictSelect). */
function DistrictSelect() {
  const [open, setOpen] = useState(false);
  const [district, setDistrict] = useState<string>("Patna");
  const wrapRef = useRef<HTMLDivElement>(null);

  // Preselect the district from ?district= (Drill Down links from the
  // super-admin overview page land here with the district in the URL).
  // Read in an effect (not the useState initializer) so SSR and the first
  // client render agree — no hydration mismatch.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("district");
    if (fromUrl && (GOV_DISTRICTS as readonly string[]).includes(fromUrl)) {
      setDistrict(fromUrl);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="District context"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-9 items-center gap-2 rounded-md border px-2.5 text-sm font-semibold text-slate-100 transition ${
          open
            ? "border-white/25 bg-white/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        <MapPin className="h-4 w-4 text-[var(--dl-blue-light)]" aria-hidden />
        <span className="max-w-[150px] truncate">{district}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Select district"
          className="absolute left-0 top-full z-50 mt-2 w-52 rounded-md border border-white/10 bg-[#111827] p-1 shadow-xl shadow-black/40"
        >
          {GOV_DISTRICTS.map((d) => {
            const active = d === district;
            return (
              <li key={d} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-sm transition ${
                    active
                      ? "bg-accent/15 font-semibold text-accent"
                      : "text-slate-200 hover:bg-white/5"
                  }`}
                  onClick={() => {
                    setDistrict(d);
                    setOpen(false);
                  }}
                >
                  {active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  <span className="truncate">{d}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SituationHeader() {
  // Re-sync (and blink) every 30s; tick every second so the relative label
  // ("Just now" → "12s ago") stays honest between resyncs.
  const lastSyncRef = useRef<number>(Date.now());
  const [, forceTick] = useState(0);
  const [blink, setBlink] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      // Skip the per-second re-render while the tab is hidden.
      if (document.hidden) return;
      const now = Date.now();
      if (now - lastSyncRef.current >= SYNC_MS) {
        lastSyncRef.current = now;
        setBlink((b) => b + 1); // remount the label → blink
      }
      forceTick((t) => t + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsed = Date.now() - lastSyncRef.current;
  const syncLabel = elapsed < JUST_NOW_MS ? "Just now" : `${Math.floor(elapsed / 1000)}s ago`;

  return (
    // top-14: the shell's DashboardTopBar is a sticky h-14 bar above this
    // header, so pinning at top-0 would slide this bar underneath it.
    <header className="sticky top-14 z-30 border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        {/* Left — District Context */}
        <div className="flex items-center gap-3">
          <span className="eoc-label hidden text-[var(--dl-text-muted)] sm:block">
            DISTRICT CONTEXT
          </span>
          <DistrictSelect />
        </div>

        {/* Right — mini-stat counters + sync line */}
        <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2.5">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              {/* Pulsing live dot */}
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full ${stat.dot} opacity-60`}
                />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${stat.dot}`} />
              </span>
              <div>
                <p className={`flex items-center gap-0.5 font-mono text-sm font-bold leading-none ${stat.tone}`}>
                  {stat.trend && <ArrowUp className="h-3 w-3" strokeWidth={2.5} aria-hidden />}
                  {stat.value}
                </p>
                <p className="eoc-label mt-0.5 text-[10px] text-[var(--dl-text-muted)]">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}

          {/* Phase 7 · Step 9 — who is viewing right now (mock WebSocket). */}
          <div className="border-l border-white/10 pl-5">
            <PresenceBar />
          </div>

          {/* Blinking "Last synced" — remounts (fades in) every 30s */}
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" aria-hidden />
            <motion.p
              key={blink}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-[11px] font-semibold tabular-nums text-[#7dd3a8]"
            >
              Last synced: {syncLabel}
            </motion.p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default SituationHeader;
