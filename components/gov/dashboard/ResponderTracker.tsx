"use client";

import { Navigation, Users } from "lucide-react";

// ---------------------------------------------------------------------
// components/gov/dashboard/ResponderTracker.tsx — Phase 7 · Step 6.
//
// 1×1 personnel widget: the active field teams with live status. Status
// tones mirror the severity scale — green for on-scene/returning, amber
// for en route, red for active rescue — and each row carries the team's
// headcount so commanders see capacity at a glance.
// ---------------------------------------------------------------------

type Team = {
  id: string;
  unit: string;
  status: "rescue" | "enroute" | "onscene" | "returning";
  members: number;
  location: string;
};

const TEAMS: Team[] = [
  { id: "t1", unit: "Unit 2", status: "rescue", members: 8, location: "Sector 4" },
  { id: "t4", unit: "Unit 4", status: "enroute", members: 6, location: "→ Barh" },
  { id: "t3", unit: "Unit 3", status: "onscene", members: 10, location: "Kankarbagh ghats" },
  { id: "t1b", unit: "Unit 1", status: "returning", members: 7, location: "Mithapur" },
];

const STATUS_META: Record<
  Team["status"],
  { label: string; chip: string; dot: string; pulse?: boolean }
> = {
  rescue: {
    label: "Active Rescue",
    chip: "border-severity-red-400/40 bg-severity-red-400/10 text-severity-red-300",
    dot: "bg-severity-red-400",
    pulse: true,
  },
  enroute: {
    label: "En Route",
    chip: "border-severity-amber-400/40 bg-severity-amber-400/10 text-severity-amber-300",
    dot: "bg-severity-amber-400",
  },
  onscene: {
    label: "On Scene",
    chip: "border-severity-green-400/40 bg-severity-green-400/10 text-severity-green-300",
    dot: "bg-severity-green-400",
    pulse: true,
  },
  returning: {
    label: "Returning",
    chip: "border-white/15 bg-white/5 text-white/60",
    dot: "bg-white/40",
  },
};

export function ResponderTracker() {
  return (
    <section className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Users aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          <h2 className="eoc-label text-white">Responder Tracker</h2>
        </div>
        <span className="rounded-full border border-severity-green-400/30 bg-severity-green-400/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-severity-green-300">
          {TEAMS.length} active
        </span>
      </header>

      <ul className="flex-1 space-y-2 p-4">
        {TEAMS.map((team) => {
          const meta = STATUS_META[team.status];
          return (
            <li
              key={team.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 transition hover:bg-black/30"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                  {meta.pulse && (
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full ${meta.dot} opacity-60`}
                    />
                  )}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[0.8125rem] font-semibold text-white/90">{team.unit}</p>
                  <p className="flex items-center gap-1 truncate text-[0.6875rem] text-[var(--dl-text-muted)]">
                    <Navigation aria-hidden="true" className="h-3 w-3 shrink-0" />
                    {team.location}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden rounded px-1.5 py-0.5 text-[0.625rem] font-semibold tabular-nums text-white/60 sm:inline">
                  {team.members} pers
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${meta.chip}`}
                >
                  {meta.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ResponderTracker;
