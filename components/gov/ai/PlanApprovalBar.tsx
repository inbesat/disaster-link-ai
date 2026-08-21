"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlanApprovalBar.tsx — Phase 9 · Step 5 · Human-in-
// the-Loop (HITL) Approval Workflow.
//
// Sticky action bar pinned below the PlanVisualizer. The swarm can draft
// a plan, but nothing deploys without commander sign-off:
//
//   • PENDING APPROVAL (amber) — three actions:
//       - "Approve & Execute" (green, prominent) → triggers alerts,
//         resource deployment, team assignments. Logs audit entry.
//       - "Request Changes" (amber) → opens comment field for feedback.
//       - "Reject" (red, ghost) → plan archived. Logs audit entry.
//   • APPROVED — "Approved by [Name] at [Time]" badge, plan becomes
//     live tracker. Executes automatically.
//   • EXECUTING — pulsing green lock-in state, plan code readout.
//   • REJECTED — plan archived, show archived badge.
//
// Audit log tracks all approval state changes with timestamp, actor,
// action, and optional comment.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Lock,
  MessageSquare,
  RotateCcw,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

type ApprovalStatus = "pending" | "executing" | "revision" | "approved" | "rejected";

type AuditEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  comment?: string;
};

/** Fired when the commander approves — PlanVisualizer enters execution. */
export const PLANNER_EXECUTING_EVENT = "planner:executing";
/** Fired by PlanVisualizer's panic button — approval returns to pending. */
export const PLANNER_HALT_EVENT = "planner:halt";

const COMMANDER_NAME = "District Admin";
const PLAN_CODE = "PNP-6-B1";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function PlanApprovalBar() {
  const toast = useToast();
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [comment, setComment] = useState("");
  const [showCommentField, setShowCommentField] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const revisionTimer = useRef<number | null>(null);

  const addAuditEntry = (action: string, commentText?: string) => {
    setAuditLog((prev) => [
      ...prev,
      {
        id: `audit-${Date.now()}`,
        timestamp: formatTime(new Date()),
        actor: COMMANDER_NAME,
        action,
        comment: commentText,
      },
    ]);
  };

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
    addAuditEntry("Approved & Executed");
    toast.success({
      title: "Plan Locked",
      description: "Auto-triggering alerts and deployments.",
      duration: 6000,
    });
    window.dispatchEvent(new CustomEvent(PLANNER_EXECUTING_EVENT));
  };

  const handleRequestChanges = () => {
    if (status !== "pending") return;
    setShowCommentField(true);
  };

  const submitChanges = () => {
    if (!comment.trim()) return;
    setStatus("revision");
    addAuditEntry("Requested Changes", comment.trim());
    setComment("");
    setShowCommentField(false);
    toast.warning({
      title: "Changes requested",
      description: "Swarm agents are revising the plan.",
      duration: 4000,
    });
    revisionTimer.current = window.setTimeout(() => setStatus("pending"), 2600);
  };

  const handleReject = () => {
    if (status !== "pending") return;
    setStatus("rejected");
    addAuditEntry("Rejected", comment.trim() || undefined);
    setComment("");
    setShowCommentField(false);
    toast.error({
      title: "Plan Rejected",
      description: "Plan has been archived.",
      duration: 4000,
    });
  };

  const handleReset = () => {
    setStatus("pending");
    addAuditEntry("Reset to Pending");
  };

  return (
    <div
      aria-live="polite"
      className="shrink-0 border-t border-white/10 bg-[#0a0f1a]/95 px-3 py-3 backdrop-blur-md"
    >
      {/* PENDING — Approval actions */}
      {status === "pending" && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              Pending Approval
            </span>
            <p className="text-[0.6875rem] text-slate-400">
              The AI cannot deploy resources until a commander signs off.
            </p>
          </div>

          {/* Comment field (shown when Request Changes is clicked) */}
          {showCommentField && (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-amber-400" aria-hidden />
                <span className="text-xs font-bold text-amber-400">Feedback for revision</span>
              </div>
              <textarea
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What needs to change? e.g. 'Reduce zone A scope to 500 residents'..."
                className="w-full resize-none rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={submitChanges}
                  disabled={!comment.trim()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-bold text-slate-950 transition hover:bg-amber-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-3 w-3" aria-hidden />
                  Submit Feedback
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCommentField(false); setComment(""); }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-bold text-slate-400 transition hover:bg-white/5 active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleApprove}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(16,185,129,0.35)] transition hover:brightness-110 active:scale-[0.99]"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Approve &amp; Execute
            </button>
            <button
              type="button"
              onClick={handleRequestChanges}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-amber-400/50 px-5 text-sm font-bold uppercase tracking-wider text-amber-400 transition hover:bg-amber-400/10 active:scale-[0.99]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Request Changes
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 px-5 text-sm font-bold uppercase tracking-wider text-slate-400 transition hover:bg-white/5 hover:text-red-400 hover:border-red-400/30 active:scale-[0.99]"
            >
              <XCircle className="h-4 w-4" aria-hidden />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* APPROVED — Badge + auto-execute */}
      {status === "approved" && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 shadow-[0_0_16px_rgba(16,185,129,0.15)]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle2 className="h-3 w-3" aria-hidden />
            Approved
          </span>
          <span className="text-xs text-emerald-300/80">
            Approved by <span className="font-bold text-emerald-300">{COMMANDER_NAME}</span> at{" "}
            <span className="font-bold text-emerald-300">{formatTime(new Date())}</span>
          </span>
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1 text-[0.625rem] font-bold text-slate-400 transition hover:bg-white/5"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Reset
          </button>
        </div>
      )}

      {/* EXECUTING — Pulsing lock-in */}
      {status === "executing" && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                Executing
              </p>
            </div>
            <span className="font-mono text-[0.625rem] text-slate-400">{PLAN_CODE}</span>
          </div>
          <p className="mt-1 text-[0.6875rem] leading-relaxed text-slate-300">
            Plan locked. Alerts broadcasting and field units deploying — telemetry will
            confirm within 5 minutes.
          </p>
        </div>
      )}

      {/* REVISION — Revising */}
      {status === "revision" && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2.5">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-amber-400"
            aria-hidden
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Revising plan
            </p>
            <p className="text-[0.6875rem] text-slate-300">
              Swarm agents are addressing requested changes…
            </p>
          </div>
        </div>
      )}

      {/* REJECTED — Archived */}
      {status === "rejected" && (
        <div className="flex flex-col gap-2.5 rounded-xl border border-slate-600/40 bg-slate-600/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-500/40 bg-slate-500/10 px-2.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider text-slate-400">
              <Archive className="h-3 w-3" aria-hidden />
              Rejected &amp; Archived
            </span>
            <span className="text-xs text-slate-500">
              Plan archived by <span className="font-bold text-slate-400">{COMMANDER_NAME}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-white/5"
          >
            <RotateCcw className="h-3 w-3" aria-hidden />
            Reset to Pending
          </button>
        </div>
      )}

      {/* Audit log toggle */}
      {auditLog.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="inline-flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-slate-500 transition hover:text-slate-300"
          >
            <FileText className="h-3 w-3" aria-hidden />
            Audit Log ({auditLog.length})
            <span className="text-[0.5rem]">{showAuditLog ? "▲" : "▼"}</span>
          </button>

          {showAuditLog && (
            <div className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-[#111827] p-3">
              {auditLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-wrap items-start gap-2 text-[0.6875rem]"
                >
                  <span className="inline-flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" aria-hidden />
                    {entry.timestamp}
                  </span>
                  <span className="font-bold text-slate-300">{entry.actor}</span>
                  <span
                    className={
                      entry.action.includes("Approved")
                        ? "text-emerald-400"
                        : entry.action.includes("Rejected")
                          ? "text-red-400"
                          : entry.action.includes("Changes")
                            ? "text-amber-400"
                            : "text-slate-400"
                    }
                  >
                    {entry.action}
                  </span>
                  {entry.comment && (
                    <span className="text-slate-500 italic">— {entry.comment}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {status !== "pending" && (
        <p className="mt-2 flex items-center gap-1.5 text-[0.625rem] text-slate-500">
          <Lock className="h-3 w-3" aria-hidden />
          Nothing deploys without commander authorization.
        </p>
      )}
    </div>
  );
}

export default PlanApprovalBar;
