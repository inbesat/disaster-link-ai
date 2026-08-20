"use client";

// ---------------------------------------------------------------------
// components/field/PreDeploymentChecklist.tsx — Phase 14 · Step 9.
//
// Nobody enters a flood zone without a life jacket. This modal forces
// itself open on the responder's FIRST login of their shift (tracked via
// a per-day localStorage flag) and blocks until every item is checked:
// VHF Radio, First Aid Kit, Life Jacket, Power Bank, Rations.
//
// "Confirm Readiness" stays disabled until all five boxes are checked.
// Confirming POSTs a mock accountability log to /api/field/checklist
// (queued via OfflineSyncQueue when disconnected) and records the day so
// it won't nag again until tomorrow.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { ShieldCheck, Check, Radio, Briefcase, LifeBuoy, BatteryCharging, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import { triggerHeavyHaptic, triggerLightHaptic } from "@/hooks/useHaptics";
import { OfflineSyncQueue } from "@/lib/field-offline";

const RESPONDER = "Sunita Das · Team Alpha · NDRF";
const FLAG_KEY = "drip_deploy_checklist_v1";

const ITEMS = [
  { key: "radio", label: "VHF Radio (Charged)", icon: Radio },
  { key: "firstaid", label: "First Aid Kit", icon: Briefcase },
  { key: "lifejacket", label: "Life Jacket", icon: LifeBuoy },
  { key: "powerbank", label: "Power Bank", icon: BatteryCharging },
  { key: "rations", label: "Rations", icon: UtensilsCrossed },
] as const;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function alreadyDoneToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(FLAG_KEY) === todayKey();
  } catch {
    return false;
  }
}

export default function PreDeploymentChecklist() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  // Auto-open once per shift — the whole point of the component.
  useEffect(() => {
    if (!alreadyDoneToday()) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const allChecked = ITEMS.every((i) => checked.has(i.key));

  function toggle(key: string) {
    triggerLightHaptic();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function confirm() {
    if (!allChecked || confirming) return;
    setConfirming(true);
    triggerHeavyHaptic();

    const payload = {
      responder: RESPONDER,
      shiftDate: todayKey(),
      items: ITEMS.filter((i) => checked.has(i.key)).map((i) => i.label),
      confirmed: true,
      at: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/field/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`checklist ${res.status}`);
    } catch {
      OfflineSyncQueue.enqueue({
        url: "/api/field/checklist",
        method: "POST",
        body: payload,
      });
    }

    try {
      window.localStorage.setItem(FLAG_KEY, todayKey());
    } catch {
      /* ignore */
    }
    setConfirming(false);
    setOpen(false);
    toast.success("Readiness confirmed — good to deploy");
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pre-deployment checklist"
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-5"
    >
      <div className="w-full max-w-md rounded-3xl border-2 border-cyan-400/50 bg-panel-deep p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-500/15 text-cyan-300">
            <ShieldCheck className="h-8 w-8" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-cyan-200">Pre-Deployment</h2>
            <p className="text-sm font-bold uppercase tracking-wider text-amber-300">
              Readiness Check
            </p>
          </div>
        </div>

        <p className="mt-3 text-base text-gray-300">
          Confirm every item before entering the field. All items are
          required — this is logged for your accountability.
        </p>

        <ul className="mt-4 space-y-2.5">
          {ITEMS.map(({ key, label, icon: Icon }) => {
            const on = checked.has(key);
            return (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  aria-pressed={on}
                  className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-4 text-left transition active:scale-[0.98] ${
                    on
                      ? "border-emerald-400/70 bg-emerald-500/15"
                      : "border-panel-borderStrong bg-panel"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                      on
                        ? "border-emerald-400 bg-emerald-500 text-black"
                        : "border-panel-borderStrong text-slate-500"
                    }`}
                  >
                    {on ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </span>
                  <span
                    className={`text-base font-bold ${
                      on ? "text-emerald-200" : "text-gray-200"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => void confirm()}
          disabled={!allChecked || confirming}
          className={`mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-lg font-black transition active:scale-[0.98] disabled:cursor-not-allowed ${
            allChecked
              ? "bg-emerald-500 text-black shadow-[0_0_24px_rgba(52,211,153,0.4)]"
              : "bg-white/10 text-slate-500"
          }`}
        >
          {confirming ? "Logging…" : "Confirm Readiness"}
        </button>
        <p className="mt-2 text-center text-[0.6875rem] text-slate-500">
          {allChecked
            ? "All items verified — you're cleared to deploy."
            : `${checked.size}/${ITEMS.length} items checked`}
        </p>
      </div>
    </div>
  );
}
