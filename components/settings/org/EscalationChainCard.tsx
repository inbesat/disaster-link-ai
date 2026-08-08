"use client";

// ---------------------------------------------------------------------
// components/settings/org/EscalationChainCard.tsx — Organization (Phase 5 · Step 8).
//
// Automated response hierarchy — "Alert Escalation Protocol" flowchart:
//   Level 1 · Primary District Admin  (user dropdown)
//       ↓  15 min no response
//   Level 2 · Super Admin              (user dropdown)
//       ↓  30 min no response
//   Level 3 · General Control Room     (phone input)
// Downward chevrons connect the tiers visually like an escalation chain.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import { AlarmClock, ChevronDown, Phone, UserRound } from "lucide-react";

const DISTRICT_ADMINS = [
  "Rajesh Nair — Ernakulam",
  "Anita Sharma — Patna",
  "Meera Pillai — Kottayam",
  "Karan Verma — Muzaffarpur",
];

const SUPER_ADMINS = [
  "Anita Sharma — Head of Ops",
  "Sita Thomas — Nodal Officer",
  "Devil Kumar — Command Lead",
];

export default function EscalationChainCard() {
  const [level1, setLevel1] = useState(DISTRICT_ADMINS[0]);
  const [level2, setLevel2] = useState(SUPER_ADMINS[0]);
  const [controlRoom, setControlRoom] = useState("+91 1800 345 6789");

  function handleSave() {
    toast.success("Escalation protocol updated and armed.", { duration: 3000 });
  }

  return (
    <section
      data-settings-key="org-escalation-chain"
      className="rounded-eoc border border-[#1c2740] bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
          <AlarmClock className="h-5 w-5 text-orange-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-orange-300/80">ESCALATION</p>
          <h2 className="mt-0.5 text-lg font-bold">Alert Escalation Protocol</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Alerts climb this chain when a responder does not acknowledge within
        the window — every tier gets a fresh push and control-room call.
      </p>

      {/* Flowchart */}
      <div className="mt-6 flex flex-col items-stretch gap-0">
        {/* Level 1 */}
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/[0.06] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-[11px] font-bold text-amber-200">
              1
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Primary District Admin
            </p>
          </div>
          <label className="sr-only" htmlFor="escalation-level-1">
            Level 1 primary district admin
          </label>
          <div className="mt-3 flex items-center gap-2.5">
            <UserRound className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
            <select
              id="escalation-level-1"
              value={level1}
              onChange={(e) => setLevel1(e.target.value)}
              className="w-full rounded-md border border-amber-400/30 bg-[#0a0f1d] px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-400/60"
            >
              {DISTRICT_ADMINS.map((user) => (
                <option key={user} value={user} className="bg-[#0a0f1d]">
                  {user}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            First response owner — District-level dispatch authority.
          </p>
        </div>

        {/* Arrow */}
        <EscalArrow label="No response in 15 min" />

        {/* Level 2 */}
        <div className="rounded-lg border border-red-400/30 bg-red-500/[0.06] p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-[11px] font-bold text-red-200">
              2
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-red-300">
              Super Admin
            </p>
          </div>
          <label className="sr-only" htmlFor="escalation-level-2">
            Level 2 super admin
          </label>
          <div className="mt-3 flex items-center gap-2.5">
            <UserRound className="h-4 w-4 shrink-0 text-red-300" aria-hidden />
            <select
              id="escalation-level-2"
              value={level2}
              onChange={(e) => setLevel2(e.target.value)}
              className="w-full rounded-md border border-red-400/30 bg-[#0a0f1d] px-3 py-2 text-sm text-slate-200 outline-none focus:border-red-400/60"
            >
              {SUPER_ADMINS.map((user) => (
                <option key={user} value={user} className="bg-[#0a0f1d]">
                  {user}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Takes over when the district admin is unresponsive.
          </p>
        </div>

        {/* Arrow 2 */}
        <EscalArrow label="No response in 30 min" />

        {/* Level 3 */}
        <div className="rounded-lg border border-white/15 bg-surface-muted/40 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-500/20 text-[11px] font-bold text-slate-200">
              3
            </span>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
              General Control Room Phone
            </p>
          </div>
          <label className="sr-only" htmlFor="escalation-level-3">
            General control room phone number
          </label>
          <div className="mt-3 flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <input
              id="escalation-level-3"
              type="tel"
              value={controlRoom}
              onChange={(e) => setControlRoom(e.target.value)}
              placeholder="e.g. 1070 or +91 …"
              className="w-full rounded-md border border-[#1c2740] bg-[#0a0f1d] px-3 py-2 font-mono text-sm text-slate-200 outline-none focus:border-orange-400/60"
            />
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Toll-free national emergency line / state control room.
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1c2740] pt-4">
        <p className="text-[11px] text-slate-500">
          Escalation timers run automatically from alert dispatch.
        </p>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-md border border-orange-400/50 bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-200 transition hover:bg-orange-500/20"
        >
          <ChevronDown className="h-4 w-4 rotate-90" aria-hidden />
          Save Protocol
        </button>
      </div>
    </section>
  );
}

function EscalArrow({ label }: { label: string }) {
  return (
    <div
      className="flex flex-col items-center gap-1 py-2"
      role="presentation"
    >
      <div className="flex h-7 w-9 items-center justify-center rounded-full border border-[#1c2740] bg-[#0a0f1d]">
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
}