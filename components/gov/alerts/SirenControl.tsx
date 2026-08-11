"use client";

// ---------------------------------------------------------------------
// components/gov/alerts/SirenControl.tsx — Phase 11 · Step 8 ·
// Hardware Siren Integration Panel.
//
// Triggering physical outdoor warning systems. Lists the district's mock
// siren towers with health status (Online = green, Malfunction = red) and
// exposes a master "TRIGGER SIRENS" control.
//
// To prevent accidents the master trigger is a SLIDER, not a button: the
// operator must drag it fully to 100% to arm the full outdoor network.
// Releasing short of the end performs an immediate, safe reset — the
// sirens never fire on a partial/accidental tap.
// ---------------------------------------------------------------------

import { useState } from "react";
import { AlertTriangle, RadioTower, RotateCcw, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

type TowerStatus = "online" | "malfunction";

type SirenTower = {
  id: string;
  name: string;
  location: string;
  status: TowerStatus;
};

const TOWERS: SirenTower[] = [
  { id: "t1", name: "Tower 1", location: "Riverside", status: "online" },
  { id: "t2", name: "Tower 2", location: "Market", status: "online" },
  { id: "t3", name: "Tower 3", location: "Railway Station", status: "malfunction" },
];

export function SirenControl() {
  const toast = useToast();
  const [trigger, setTrigger] = useState(0);
  const [active, setActive] = useState(false);

  const onlineCount = TOWERS.filter((t) => t.status === "online").length;

  const onTriggerChange = (value: number) => {
    setTrigger(value);
    if (value >= 100 && !active) {
      setActive(true);
      toast.success({
        title: "🚨 Outdoor sirens triggered",
        description: `${onlineCount} towers sounding · full coverage engaged`,
        duration: 6000,
      });
    } else if (value < 100 && active) {
      // Slid back before release — safe reset.
      setActive(false);
    }
  };

  const reset = () => {
    setTrigger(0);
    setActive(false);
  };

  return (
    <section
      className="rounded-xl border border-white/10 bg-secondary p-5"
      aria-label="Hardware siren integration"
    >
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-accent-purple/30 bg-accent-purple/10 text-accent-purple">
          <Volume2 className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Hardware Sirens
          </h2>
          <p className="text-xs text-muted">
            Trigger physical outdoor warning towers across the district
          </p>
        </div>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider ${
            active
              ? "border-severity-red-500/60 bg-severity-red-500/15 text-severity-red-300"
              : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${
              active ? "animate-pulse bg-severity-red-500" : "bg-emerald-400"
            }`}
          />
          {active ? "SIRENS ACTIVE" : `${onlineCount} online`}
        </span>
      </header>

      {/* Siren tower list with status indicators. */}
      <div className="space-y-2">
        {TOWERS.map((tower) => {
          const online = tower.status === "online";
          return (
            <div
              key={tower.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                online
                  ? "border-white/10 bg-white/5"
                  : "border-severity-red-500/40 bg-severity-red-500/10"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                  online
                    ? "bg-white/5 text-slate-300"
                    : "bg-severity-red-500/20 text-severity-red-300"
                }`}
              >
                <RadioTower className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-white">
                  {tower.name} <span className="text-slate-400">· {tower.location}</span>
                </span>
                <span className="block text-[0.625rem] text-slate-400">
                  {online ? "Operational · 500m radius" : "Malfunction · maintenance due"}
                </span>
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${
                  online
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-severity-red-500/50 bg-severity-red-500/15 text-severity-red-300"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-1.5 w-1.5 rounded-full ${
                    online ? "bg-emerald-400" : "bg-severity-red-500"
                  }`}
                />
                {online ? "Online" : "Malfunction"}
              </span>
              {!online && (
                <AlertTriangle
                  className="h-3.5 w-3.5 shrink-0 text-severity-red-400"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Master TRIGGER SIRENS slider — must slide, not click. */}
      <div
        className={`mt-4 rounded-lg border p-4 ${
          active
            ? "border-severity-red-500/60 bg-severity-red-500/10"
            : "border-severity-amber-500/40 bg-severity-amber-500/5"
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[0.6875rem] font-black uppercase tracking-wider text-white">
            🚨 Trigger Sirens
          </p>
          <span
            className={`font-mono text-sm font-bold tabular-nums ${
              active ? "text-severity-red-300" : "text-severity-amber-300"
            }`}
          >
            {trigger}%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={trigger}
          aria-label="Master siren trigger — slide all the way to activate"
          onChange={(e) => onTriggerChange(Number(e.target.value))}
          className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-severity-red-500 [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        />

        <p className="mt-3 text-[0.6875rem] leading-snug text-slate-400">
          {active
            ? "All online towers are sounding. Use Reset to stand them down."
            : "Slide fully to 100% to activate. It must be dragged — a click or partial slide will not trigger the network."}
        </p>

        <button
          type="button"
          onClick={reset}
          disabled={!active}
          className={`mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border text-[0.6875rem] font-bold uppercase tracking-wider transition ${
            active
              ? "border-severity-red-500/50 bg-severity-red-500/15 text-severity-red-300 hover:bg-severity-red-500/25"
              : "cursor-not-allowed border-white/10 bg-white/5 text-slate-600"
          }`}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {active ? "Reset · Stand down sirens" : "Reset (inactive)"}
        </button>
      </div>
    </section>
  );
}

export default SirenControl;
