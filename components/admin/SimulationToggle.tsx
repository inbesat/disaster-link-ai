"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RadioTower, PlugZap } from "lucide-react";
import {
  disableSimulationMode,
  enableSimulationMode,
} from "@/app/actions/simulation";

export default function SimulationToggle({ active }: { active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleToggle() {
    setBusy(true);
    try {
      if (active) {
        await disableSimulationMode();
        toast("Simulation mode disabled — live alerts re-enabled", {
          icon: "🔴",
        });
      } else {
        await enableSimulationMode();
        toast("Simulation mode engaged — no real alerts will be sent", {
          icon: "🟡",
        });
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
        active
          ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.4),0_0_18px_rgba(250,204,21,0.2)]"
          : "border-[#1c2740] bg-[#0b1120]"
      }`}
    >
      <div className="leading-tight">
        <p
          className={`text-[11px] font-bold uppercase tracking-wider ${
            active ? "text-yellow-300" : "text-slate-400"
          }`}
        >
          {active ? "Simulation Active" : "Master Breaker"}
        </p>
        <p className="text-[10px] text-slate-500">
          {active ? "Blocking real alerts" : "Off · live mode"}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={active}
        aria-label="Toggle training simulation mode"
        onClick={handleToggle}
        disabled={busy}
        className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border-2 transition disabled:opacity-60 ${
          active
            ? "justify-end border-yellow-300 bg-yellow-400"
            : "justify-start border-slate-600 bg-slate-800"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0b1120] text-yellow-300 shadow">
          {active ? (
            <PlugZap className="h-3.5 w-3.5" />
          ) : (
            <RadioTower className="h-3.5 w-3.5 text-slate-500" />
          )}
        </span>
      </button>
    </div>
  );
}