"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/QuickDialCard.tsx — Contacts (Phase 7 · Step 4).
//
// Tactical Quick Dial — the responder speed-dial grid:
//   • 3×2 CSS grid of large, square, high-tap-target buttons.
//   • Hardcoded demo targets: District Magistrate, NDRF Commander,
//     Nearest Hospital, Fire Station, Police (+ an Add Shortcut tile to
//     complete the grid).
//   • Distinct icon + bold label per tile; clicking simulates a call with
//     a "Simulating call to [Target]…" toast for the live demo.
// ---------------------------------------------------------------------

import { useState } from "react";
import toast from "react-hot-toast";
import {
  Cross,
  Flame,
  Hospital,
  Landmark,
  PhoneForwarded,
  Plus,
  Siren,
  UserCog,
} from "lucide-react";

type Target = {
  key: string;
  label: string;
  icon: typeof Landmark;
  tileClass: string;
  iconClass: string;
};

const TARGETS: Target[] = [
  {
    key: "dm",
    label: "District Magistrate",
    icon: Landmark,
    tileClass: "border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20",
    iconClass: "text-sky-300",
  },
  {
    key: "ndrf",
    label: "NDRF Commander",
    icon: UserCog,
    tileClass: "border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20",
    iconClass: "text-amber-300",
  },
  {
    key: "hospital",
    label: "Nearest Hospital",
    icon: Hospital,
    tileClass: "border-rose-400/40 bg-rose-500/10 hover:bg-rose-500/20",
    iconClass: "text-rose-300",
  },
  {
    key: "fire",
    label: "Fire Station",
    icon: Flame,
    tileClass: "border-orange-400/40 bg-orange-500/10 hover:bg-orange-500/20",
    iconClass: "text-orange-300",
  },
  {
    key: "police",
    label: "Police",
    icon: Siren,
    tileClass: "border-violet-400/40 bg-violet-500/10 hover:bg-violet-500/20",
    iconClass: "text-violet-300",
  },
];

export default function QuickDialCard() {
  // Simulated ring-back so the demo feels alive — resets after 1.2s.
  const [calling, setCalling] = useState<string | null>(null);

  function simulateCall(target: Target) {
    // One call at a time — ignore taps while the ring-back is active so
    // rapid clicks can't stack timers or spam toasts.
    if (calling) return;
    setCalling(target.key);
    window.setTimeout(() => setCalling(null), 1200);
    toast(`Simulating call to ${target.label}...`, { duration: 2500 });
  }

  return (
    <section
      data-settings-key="contacts-quickdial"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
          <PhoneForwarded className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-amber-400/80">TACTICAL SPEED DIAL</p>
          <h2 className="mt-0.5 text-lg font-bold">Tactical Quick Dial</h2>
        </div>
        <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 font-mono text-eoc-tiny font-bold tabular-nums text-amber-200">
          {TARGETS.length} targets
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        One tap connects you to the units that matter in the first 60 seconds
        of an incident.
      </p>

      {/* Speed-dial grid — 3×2 */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {TARGETS.map((target) => {
          const Icon = target.icon;
          const active = calling === target.key;
          return (
            <button
              key={target.key}
              type="button"
              onClick={() => simulateCall(target)}
              aria-label={`Simulate call to ${target.label}`}
              className={`flex aspect-square flex-col items-center justify-center gap-2.5 rounded-md border p-2 transition hover:scale-[1.03] active:scale-[0.96] ${target.tileClass} ${
                active ? "ring-2 ring-emerald-400/70" : ""
              }`}
            >
              <Icon
                className={`h-7 w-7 ${target.iconClass} ${
                  active ? "animate-pulse" : ""
                }`}
                aria-hidden
              />
              <span className="px-1 text-center text-[11px] font-bold leading-tight text-slate-100">
                {target.label}
              </span>
            </button>
          );
        })}

        {/* Grid-completing add tile */}
        <button
          type="button"
          onClick={() =>
            toast("Shortcut editor arrives in a later step.", { duration: 2500 })
          }
          aria-label="Add a custom shortcut"
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-md border border-dashed border-panel-borderHover bg-surface-muted/30 p-2 text-slate-500 transition hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-300"
        >
          <Plus className="h-6 w-6" aria-hidden />
          <span className="px-1 text-center text-[11px] font-bold leading-tight">
            Add Shortcut
          </span>
        </button>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-slate-500">
        <Cross className="h-3.5 w-3.5 shrink-0 text-rose-300" aria-hidden />
        Demo fixtures — wire each tile to the real dispatch number before
        go-live.
      </p>
    </section>
  );
}
