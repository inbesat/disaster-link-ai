"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlanHistory.tsx — Phase 9 · Step 9 · Plan History &
// Version Control.
//
// A slide-out drawer (mounted in the PlanVisualizer header) listing the
// saved plan revisions for audit and comparative analysis:
//
//   • Plan v1.0 (Original)            — baseline
//   • Plan v1.1 (Heavy Rain Scenario) — scenario variant
//   • Plan v2.0 (Approved)            — the current, commander-approved plan
//
// Each revision offers three actions — Revert, Compare, Clone for New
// District — wired to confirmation toasts in the demo. The drawer is a
// viewport-fixed dialog (Esc / backdrop / ✕ to dismiss, focus returns
// to the trigger).
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  Columns2,
  Copy,
  History as HistoryIcon,
  RotateCcw,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

type SavedPlan = {
  id: string;
  version: string;
  label: string;
  meta: string;
  badge: { label: string; classes: string };
  current?: boolean;
};

const SAVED_PLANS: SavedPlan[] = [
  {
    id: "v1.0",
    version: "Plan v1.0",
    label: "(Original)",
    meta: "Baseline draft · 11 Aug, 09:40 IST",
    badge: { label: "Baseline", classes: "border-white/15 bg-white/5 text-slate-400" },
  },
  {
    id: "v1.1",
    version: "Plan v1.1",
    label: "(Heavy Rain Scenario)",
    meta: "Rainfall +50% · 11 Aug, 10:05 IST",
    badge: {
      label: "Scenario",
      classes: "border-accent-warning/40 bg-accent-warning/10 text-accent-warning",
    },
  },
  {
    id: "v2.0",
    version: "Plan v2.0",
    label: "(Approved)",
    meta: "Commander sign-off · 11 Aug, 10:12 IST",
    badge: {
      label: "Approved",
      classes: "border-accent-success/40 bg-accent-success/10 text-accent-success",
    },
    current: true,
  },
];

type PlanAction = { label: string; icon: LucideIcon; run: () => void };

const DRAWER_ID = "plan-history-drawer";
const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PlanHistory() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(false);

  // Esc dismisses; Tab stays trapped inside the drawer while it is open.
  useEffect(() => {
    if (!open) return;
    const dialog = document.getElementById(DRAWER_ID);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Return focus to the trigger only after a REAL close (not on mount).
  useEffect(() => {
    if (prevOpenRef.current && !open) {
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
    prevOpenRef.current = open;
  }, [open]);

  const close = () => setOpen(false);

  const actionsFor = (plan: SavedPlan): PlanAction[] => [
    {
      label: "Revert",
      icon: RotateCcw,
      run: () =>
        toast.info({
          title: `Reverted to ${plan.version}`,
          description: "Swarm agents are re-planning from this revision.",
        }),
    },
    {
      label: "Compare",
      icon: Columns2,
      run: () =>
        toast.info({
          title: `Comparing ${plan.version}`,
          description: "Differences against the current plan are highlighted.",
        }),
    },
    {
      label: "Clone for New District",
      icon: Copy,
      run: () =>
        toast.success({
          title: `Cloned ${plan.version}`,
          description: "Draft created for a new district — open in the planner.",
        }),
    },
  ];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={DRAWER_ID}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300 transition hover:border-accent-purple/50 hover:text-accent-purple"
      >
        <HistoryIcon className="h-3.5 w-3.5" aria-hidden />
        History
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            aria-hidden
            onClick={close}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer panel */}
          <div
            id={DRAWER_ID}
            role="dialog"
            aria-modal="true"
            aria-label="Plan history"
            className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col border-l border-white/10 bg-[#0d1526] shadow-2xl animate-in slide-in-from-right-2 duration-200"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple">
                  <HistoryIcon className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">Plan History</h3>
                  <p className="text-[10px] uppercase tracking-wider text-muted">
                    Version control &amp; audits
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                autoFocus
                aria-label="Close plan history"
                className="rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:border-accent-purple/50 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Saved plans */}
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
              {SAVED_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-3 ${
                    plan.current
                      ? "border-accent-purple/40 bg-accent-purple/5"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">
                      {plan.version}{" "}
                      <span className="font-medium text-slate-400">{plan.label}</span>
                    </p>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${plan.badge.classes}`}
                    >
                      {plan.current && (
                        <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
                      )}
                      {plan.badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-muted">{plan.meta}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {actionsFor(plan).map((action) => (
                      <button
                        key={action.label}
                        type="button"
                        onClick={action.run}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:border-accent-purple/50 hover:text-accent-purple active:scale-95"
                      >
                        <action.icon className="h-3 w-3" aria-hidden />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer footer */}
            <div className="border-t border-white/10 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[10px] text-muted">
                <ShieldCheck className="h-3 w-3 text-accent-success" aria-hidden />
                Every change is logged &amp; audited · 5 revisions stored
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default PlanHistory;
