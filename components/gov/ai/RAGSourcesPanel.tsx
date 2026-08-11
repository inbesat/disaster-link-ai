"use client";

// ---------------------------------------------------------------------
// components/gov/ai/RAGSourcesPanel.tsx — Phase 9 · Step 7 · RAG Sources
// Transparency Panel.
//
// An expandable accordion attached to the bottom of AI chat bubbles that
// proves every answer is grounded in official government policy:
//
//   • Collapsed: a slim "References & Grounding" row with a green
//     "Confidence 98%" badge.
//   • Expanded: the list of retrieved mock documents (NDMA Guideline
//     4.2 · Mass Evacuation, District DMP 2024, State SOP) with a
//     footer noting the retrieval source.
//
// `sources` / `confidence` props let callers tailor grounding per
// message; defaults cover the standard doc set.
// ---------------------------------------------------------------------

import { useId, useState } from "react";
import { ChevronDown, FileText, Scale, ShieldCheck, type LucideIcon } from "lucide-react";

export type RAGSource = {
  /** Full citation shown in the expanded list. */
  title: string;
  /** Per-document icon (doc type). */
  icon: LucideIcon;
};

/** Canonical government documents — exported so chat prompts can reuse. */
export const NDMA_SOURCE: RAGSource = {
  title: "NDMA Guideline 4.2 (Section: Mass Evacuation)",
  icon: ShieldCheck,
};
export const DMP_SOURCE: RAGSource = { title: "District DMP 2024", icon: FileText };
export const SOP_SOURCE: RAGSource = { title: "State SOP", icon: Scale };

export const DEFAULT_SOURCES: RAGSource[] = [NDMA_SOURCE, DMP_SOURCE, SOP_SOURCE];

type RAGSourcesPanelProps = {
  /** Retrieved documents shown when expanded. */
  sources?: RAGSource[];
  /** Retrieval confidence score (0–100). */
  confidence?: number;
};

export function RAGSourcesPanel({
  sources = DEFAULT_SOURCES,
  confidence = 98,
}: RAGSourcesPanelProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const highConfidence = confidence >= 90;

  return (
    <div className="mt-1.5 w-full max-w-[92%]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-left transition hover:border-accent-purple/40"
      >
        <span className="flex min-w-0 items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-wider text-slate-300">
          <FileText className="h-3 w-3 shrink-0 text-accent-purple" aria-hidden />
          <span className="truncate">References &amp; Grounding</span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </span>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wider ${
            highConfidence
              ? "border-accent-success/40 bg-accent-success/10 text-accent-success"
              : "border-accent-warning/40 bg-accent-warning/10 text-accent-warning"
          }`}
        >
          <ShieldCheck className="h-2.5 w-2.5" aria-hidden />
          Confidence {confidence}%
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="mt-1 space-y-0.5 rounded-md border border-white/10 bg-white/[0.03] p-2 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {sources.map((source) => {
            const SourceIcon = source.icon;
            return (
              <div
                key={source.title}
                className="flex items-start gap-2 rounded px-1.5 py-1"
              >
                <SourceIcon
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-purple"
                  aria-hidden
                />
                <span className="text-[0.6875rem] leading-snug text-slate-300">
                  {source.title}
                </span>
              </div>
            );
          })}
          <p className="pt-1 text-[0.5625rem] uppercase tracking-wider text-muted">
            Retrieved via RAG · Grounded in official policy
          </p>
        </div>
      )}
    </div>
  );
}

export default RAGSourcesPanel;
