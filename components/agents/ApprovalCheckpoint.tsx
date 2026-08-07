"use client";

import { AlertTriangle, Loader2, ShieldCheck, RotateCcw } from "lucide-react";

// ---------------------------------------------------------------------
// components/agents/ApprovalCheckpoint.tsx
// Human-in-the-Loop gate. Renders only when the pipeline reaches
// `pending_approval`, showing the proposed evacuation plan + resource
// allocations and demanding a commander decision before anything is deployed.
// "AUTHORIZE DEPLOYMENT" hands off to the Communicator Agent; "REJECT & REPLAN"
// sends the pipeline back.
// ---------------------------------------------------------------------

export type ProposedAllocation = {
  resourceType?: string;
  quantity?: number;
  targetZone?: string;
  eta?: string;
};

type Props = {
  open: boolean;
  riskLevel?: string;
  evacuationPlan: string;
  resourceAllocations: ProposedAllocation[];
  authorizing?: boolean;
  onAuthorize: () => void;
  onReject: () => void;
};

export default function ApprovalCheckpoint({
  open,
  riskLevel,
  evacuationPlan,
  resourceAllocations,
  authorizing = false,
  onAuthorize,
  onReject,
}: Props) {
  if (!open) return null;

  return (
    <div className="mt-6 rounded-eoc border-2 border-severity-amber-500/70 bg-severity-amber-500/10 p-5 shadow-glow-amber">
      {/* Header */}
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-severity-amber-400" aria-hidden />
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-severity-amber-300">
            Human-in-the-Loop · Deployment Approval Required
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            The agents will not deploy anything until a commander authorizes
            this plan. Risk:{" "}
            <span className="font-mono font-bold text-severity-amber-300">
              {riskLevel ?? "HIGH"}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {/* Proposed evacuation plan */}
        <div className="rounded-eoc border border-border bg-surface/60 p-4">
          <p className="eoc-label text-accent">PROPOSED EVACUATION PLAN</p>
          <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-border/60 bg-background p-3 font-mono text-[12px] leading-relaxed text-slate-300">
            {evacuationPlan || "No plan drafted."}
          </pre>
        </div>

        {/* Proposed resource allocations */}
        <div className="overflow-hidden rounded-eoc border border-border bg-surface/60">
          <div className="border-b border-border px-4 py-3">
            <p className="eoc-label text-accent">PROPOSED ALLOCATIONS</p>
          </div>
          {resourceAllocations.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No allocations proposed.</p>
          ) : (
            <ul className="divide-y divide-border">
              {resourceAllocations.map((alloc, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {alloc.resourceType ?? "Resource"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {alloc.targetZone ?? "—"} · ETA {alloc.eta ?? "—"}
                    </p>
                  </div>
                  <span className="rounded-md bg-surface-muted px-2 py-1 text-sm font-black tabular-nums text-severity-amber-300">
                    {alloc.quantity ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Decision buttons */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={authorizing}
          onClick={onAuthorize}
          className="flex items-center justify-center gap-2 rounded-lg bg-severity-green-500 px-4 py-4 text-base font-black uppercase tracking-wider text-slate-950 shadow-glow-green transition hover:bg-severity-green-400 active:scale-95 disabled:opacity-50"
        >
          {authorizing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              Broadcasting…
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" aria-hidden />
              Authorize Deployment
            </>
          )}
        </button>

        <button
          type="button"
          disabled={authorizing}
          onClick={onReject}
          className="flex items-center justify-center gap-2 rounded-lg bg-severity-red-600 px-4 py-4 text-base font-black uppercase tracking-wider text-slate-100 shadow-glow-red transition hover:bg-severity-red-500 active:scale-95 disabled:opacity-50"
        >
          <RotateCcw className="h-5 w-5" aria-hidden />
          Reject & Replan
        </button>
      </div>
    </div>
  );
}