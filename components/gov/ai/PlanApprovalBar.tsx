"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlanApprovalBar.tsx — Phase 9 · Step 5 · Human-in-
// the-Loop (HITL) Approval Workflow.
//
// Sticky action bar pinned below the PlanVisualizer. The swarm can draft
// a plan, but nothing deploys without commander sign-off:
//
//   • PENDING APPROVAL (amber) — two massive actions:
//       - "Approve & Execute" (green, glowing) → fires the dramatic
//         success toast "Plan Locked. Auto-triggering alerts and
//         deployments." and locks the UI into the EXECUTING state.
//       - "Request Changes" (red outline) → shows a brief REVISING state
//         (agents revising) then returns to Pending Approval.
//   • EXECUTING — pulsing green lock-in state, plan code readout.
//
// The bar announces state changes via aria-live.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

type ApprovalStatus = "pending" | "executing" | "revision";

/** Fired when the commander approves — PlanVisualizer enters execution. */
export const PLANNER_EXECUTING_EVENT = "planner:executing";
/** Fired by PlanVisualizer's panic button — approval returns to pending. */
export const PLANNER_HALT_EVENT = "planner:halt";

export function PlanApprovalBar() {
  const toast = useToast();
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const revisionTimer = useRef<number | null>(null);

  // Halt Operations (Step 10) drops the bar back to Pending Approval.
  useEffect(() => {
    const onHalt = () => setStatus("pending");
    window.addEventListener(PLANNER_HALT_EVENT, onHalt);
    return () => window.removeEventListener(PLANNER_HALT_EVENT, onHalt);
  }, []);

  // Clear the revision auto-return timer if the bar unmounts mid-revision.
  useEffect(() => {
    return () => {
      if (revisionTimer.current !== null) window.clearTimeout(revisionTimer.current);
    };
  }, []);

  const handleApprove = () => {
    if (status !== "pending") return;
    setStatus("executing");
    // Dramatic lock-in: the plan is now immutable and deployments begin.
    toast.success({
      title: "Plan Locked",
      description: "Auto-triggering alerts and deployments.",
      duration: 6000,
    });
    // Kick the PlanVisualizer into Execution Mode (Step 10).
    window.dispatchEvent(new CustomEvent(PLANNER_EXECUTING_EVENT));
  };

  const handleRequestChanges = () => {
    if (status !== "pending") return;
    setStatus("revision");
    toast.warning({
      title: "Changes requested",
      description: "Swarm agents are revising the plan.",
      duration: 4000,
    });
    revisionTimer.current = window.setTimeout(() => setStatus("pending"), 2600);
  };

  return (
    <div
      aria-live="polite"
      className="shrink-0 border-t border-white/10 bg-[#0d1526]/95 px-3 py-3 backdrop-blur"
    >
      {status === "pending" && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-warning/40 bg-accent-warning/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-warning shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Pending Approval
            </span>
            <p className="text-[11px] text-slate-400">
              The AI cannot deploy resources until a commander signs off.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleApprove}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-accent-success px-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:brightness-110 active:scale-[0.99]"
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Approve &amp; Execute
            </button>
            <button
              type="button"
              onClick={handleRequestChanges}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-accent-danger/50 px-5 text-sm font-bold uppercase tracking-wider text-accent-danger transition hover:bg-accent-danger/10 active:scale-[0.99]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Request Changes
            </button>
          </div>
        </div>
      )}

      {status === "executing" && (
        <div className="rounded-xl border border-accent-success/40 bg-accent-success/10 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-success" />
              </span>
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-accent-success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Executing
              </p>
            </div>
            <span className="font-mono text-[10px] text-slate-400">PNP-6-B1</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            Plan locked. Alerts broadcasting and field units deploying — telemetry will
            confirm within 5 minutes.
          </p>
        </div>
      )}

      {status === "revision" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-accent-warning/40 bg-accent-warning/10 px-3 py-2.5">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-accent-warning"
            aria-hidden
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent-warning">
              Revising plan
            </p>
            <p className="text-[11px] text-slate-300">
              Swarm agents are addressing requested changes…
            </p>
          </div>
        </div>
      )}

      {status !== "pending" && (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
          <Lock className="h-3 w-3" aria-hidden />
          Nothing deploys without commander authorization.
        </p>
      )}
    </div>
  );
}

export default PlanApprovalBar;
