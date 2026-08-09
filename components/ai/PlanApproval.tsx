"use client";

// ---------------------------------------------------------------------
// components/ai/PlanApproval.tsx — UI/UX Phase 6 · Step 8.
//
// Human-in-the-loop sign-off bar pinned to the bottom of the plan pane.
// A commander must explicitly approve before anything deploys:
//   • "Approve & Execute Plan" — massive, accent-success CTA
//   • "Modify Request"        — secondary outline
//   • "Reject"                — ghost, danger text
// Approve → brief "executing" state → persistent "Monitoring" mode, with
// a success toast pushed through the global toast system.
// ---------------------------------------------------------------------

import { useState } from "react";
import { CheckCircle2, Loader2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export type PlanStatus = "idle" | "executing" | "monitoring";

type PlanApprovalProps = {
  /** Lets the parent swap the plan header into an active-monitoring chip. */
  onStatusChange?: (status: PlanStatus) => void;
};

export function PlanApproval({ onStatusChange }: PlanApprovalProps) {
  const [status, setStatus] = useState<PlanStatus>("idle");

  const transition = (next: PlanStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  const handleApprove = () => {
    if (status !== "idle") return;
    transition("executing");
    window.setTimeout(() => {
      transition("monitoring");
      showToast("success", {
        title: "Plan Executed",
        description: "Audit log updated.",
      });
    }, 1400);
  };

  const handleReject = () => {
    transition("idle");
    showToast("error", {
      title: "Plan Rejected",
      description: "No resources were deployed.",
    });
  };

  return (
    <div className="border-t border-border pt-3">
      {status === "monitoring" ? (
        <div className="rounded-lg border border-accent-success/40 bg-accent-success/10 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-success" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-accent-success">
                Plan Active — Monitoring
              </p>
            </div>
            <span className="font-mono text-[10px] text-slate-400">PNP-6-B1</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            Field units dispatched. Flood level telemetry refreshing every 5 min;
            auto-escalation above 3.2 m.
          </p>
          <button
            type="button"
            onClick={handleReject}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition hover:text-accent-danger"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Stand down & revert to draft
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={status === "executing"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-success text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.3)] transition hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "executing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Broadcasting to field units…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Approve &amp; Execute Plan
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border py-2.5 text-xs font-semibold text-slate-200 transition hover:border-accent-purple/50 hover:text-accent-purple"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Modify Request
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold text-accent-danger transition hover:bg-accent-danger/10"
            >
              <XCircle className="h-3.5 w-3.5" aria-hidden />
              Reject
            </button>
          </div>
        </div>
      )}

      {status === "idle" && (
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted">
          <CheckCircle2 className="h-3 w-3 text-accent-success" aria-hidden />
          Awaiting commander sign-off — nothing deploys until approved.
        </p>
      )}
    </div>
  );
}

export default PlanApproval;
