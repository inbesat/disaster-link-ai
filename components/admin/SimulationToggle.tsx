"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RadioTower, PlugZap } from "lucide-react";
import {
  disableSimulationMode,
  enableSimulationMode,
} from "@/app/actions/simulation";

export default function SimulationToggle({ active: initialActive }: { active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [isBreakerOn, setIsBreakerOn] = useState(initialActive);

  async function handleToggle() {
    setBusy(true);
    try {
      const nextState = !isBreakerOn;
      if (nextState) {
        await enableSimulationMode();
        toast("Simulation mode engaged — no real alerts will be sent", {
          icon: "🟡",
        });
      } else {
        await disableSimulationMode();
        toast("Simulation mode disabled — live alerts re-enabled", {
          icon: "🔴",
        });
      }
      setIsBreakerOn(nextState);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
        isBreakerOn
          ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_0_1px_rgba(250,204,21,0.4),0_0_18px_rgba(250,204,21,0.2)]"
          : "border-panel-border bg-panel"
      }`}
    >
      <div className="leading-tight">
        <p
          className={`text-[0.6875rem] font-bold uppercase tracking-wider ${
            isBreakerOn ? "text-yellow-300" : "text-slate-400"
          }`}
        >
          {isBreakerOn ? "Simulation Active" : "Master Breaker"}
        </p>
        <p className="text-[0.625rem] text-slate-500">
          {isBreakerOn ? "On · offline mode" : "Off · live mode"}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isBreakerOn}
        aria-label="Toggle training simulation mode"
        onClick={handleToggle}
        disabled={busy}
        className={`relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border-2 transition disabled:opacity-60 ${
          isBreakerOn
            ? "justify-end border-yellow-300 bg-yellow-400"
            : "justify-start border-slate-600 bg-slate-800"
        }`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-panel text-yellow-300 shadow">
          {isBreakerOn ? (
            <PlugZap className="h-3.5 w-3.5" />
          ) : (
            <RadioTower className="h-3.5 w-3.5 text-slate-500" />
          )}
        </span>
      </button>
    </div>
  );
}