"use client";

import { useState } from "react";
import { Navigation, Users, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------
// components/gov/dashboard/ResponderTracker.tsx — Phase 7 · Step 6.
//
// 1×1 personnel widget: 8 responder avatars (40px circles) with status
// dots, "+N more" overflow, hover tooltips with name + role + task.
// "View All Team →" link at bottom.
// ---------------------------------------------------------------------

type Responder = {
  id: string;
  name: string;
  role: string;
  task: string;
  status: "online" | "busy" | "offline";
  avatar: string;
};

const RESPONDERS: Responder[] = [
  { id: "r1", name: "Rajesh Kumar", role: "Team Lead", task: "Sector 4 evacuation", status: "online", avatar: "RK" },
  { id: "r2", name: "Priya Singh", role: "Paramedic", task: "Medical triage — Kankarbagh", status: "online", avatar: "PS" },
  { id: "r3", name: "Amit Patel", role: "Rescue Diver", task: "River patrol — Ganga ghat", status: "busy", avatar: "AP" },
  { id: "r4", name: "Sunita Devi", role: "Logistics", task: "Shelter supply run", status: "busy", avatar: "SD" },
  { id: "r5", name: "Vikram Rao", role: "Driver", task: "En route — Barh block", status: "online", avatar: "VR" },
  { id: "r6", name: "Neha Gupta", role: "Comms Officer", task: "Relay coordination", status: "online", avatar: "NG" },
  { id: "r7", name: "Sanjay Mishra", role: "Engineer", task: "Pump station repair", status: "offline", avatar: "SM" },
  { id: "r8", name: "Anjali Kumari", role: "Medic", task: "Standby — Patna Medical", status: "offline", avatar: "AK" },
];

const STATUS_DOT: Record<Responder["status"], { dot: string; pulse?: boolean }> = {
  online: { dot: "bg-emerald-400", pulse: true },
  busy: { dot: "bg-amber-400" },
  offline: { dot: "bg-slate-500" },
};

const AVATAR_COLORS = [
  "bg-gradient-to-br from-blue-600 to-blue-800",
  "bg-gradient-to-br from-emerald-600 to-emerald-800",
  "bg-gradient-to-br from-amber-600 to-amber-800",
  "bg-gradient-to-br from-purple-600 to-purple-800",
  "bg-gradient-to-br from-red-600 to-red-800",
  "bg-gradient-to-br from-cyan-600 to-cyan-800",
  "bg-gradient-to-br from-pink-600 to-pink-800",
  "bg-gradient-to-br from-teal-600 to-teal-800",
];

export function ResponderTracker() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const visible = RESPONDERS.slice(0, 6);
  const overflow = RESPONDERS.length - visible.length;

  return (
    <section className="flex flex-col rounded-xl border border-white/10 bg-[#111827] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Users aria-hidden="true" className="h-4 w-4 text-blue-400" />
          <h2 className="eoc-label text-white">Responder Tracker</h2>
        </div>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-emerald-300">
          {RESPONDERS.filter((r) => r.status !== "offline").length} active
        </span>
      </header>

      {/* Avatar grid */}
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {visible.map((r, i) => {
            const s = STATUS_DOT[r.status];
            return (
              <div
                key={r.id}
                className="relative"
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${AVATAR_COLORS[i]} transition ring-2 ring-[#111827] hover:ring-blue-400/50 hover:scale-110 cursor-pointer`}
                >
                  {r.avatar}
                </div>
                {/* Status dot */}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#111827]">
                  {s.pulse && (
                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${s.dot} opacity-60`} />
                  )}
                  <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`} />
                </span>
                {/* Hover tooltip */}
                {hoveredId === r.id && (
                  <div className="absolute left-1/2 top-full z-20 mt-2 w-48 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 shadow-xl">
                    <p className="text-xs font-bold text-white">{r.name}</p>
                    <p className="text-[0.625rem] text-blue-400">{r.role}</p>
                    <p className="mt-1 text-[0.625rem] text-slate-400 truncate">{r.task}</p>
                  </div>
                )}
              </div>
            );
          })}
          {overflow > 0 && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-xs font-bold text-slate-400">
              +{overflow}
            </div>
          )}
        </div>

        {/* Status legend */}
        <div className="mt-3 flex items-center gap-3 text-[0.625rem] text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Online</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Busy</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-500" /> Offline</span>
        </div>

        {/* View All link */}
        <a
          href="#"
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-400 transition hover:text-blue-300"
        >
          View All Team <ChevronRight className="h-3 w-3" />
        </a>
      </div>
    </section>
  );
}

export default ResponderTracker;
