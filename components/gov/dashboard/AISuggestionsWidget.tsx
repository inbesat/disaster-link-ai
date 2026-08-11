"use client";

import { FileText, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/useToast";

// ---------------------------------------------------------------------
// components/gov/dashboard/AISuggestionsWidget.tsx — Phase 7 · Step 6.
//
// 1×1 machine-intelligence widget. A glowing purple border (severity
// purple + soft outer shadow) marks the AI suggestion as something the
// command staff should review before acting. The prominent "Review Plan"
// button fires the plan review flow — wired to a confirmation toast in
// the demo, ready to route to the full plan viewer later.
// ---------------------------------------------------------------------

export function AISuggestionsWidget() {
  const toast = useToast();

  return (
    <section className="relative flex flex-col overflow-hidden rounded-[var(--dl-radius-sm)] border border-severity-purple-400/50 bg-white/[0.04] p-5 shadow-[0_0_28px_rgba(192,132,252,0.18)] backdrop-blur transition hover:border-severity-purple-300/70 hover:shadow-[0_0_38px_rgba(192,132,252,0.28)]">
      {/* Ambient purple glow — top gradient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-severity-purple-400/20 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-severity-purple-400/15 text-severity-purple-300">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <p className="eoc-label text-severity-purple-300">AI SUGGESTION</p>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-white/85">
          AI drafted an{" "}
          <span className="font-semibold text-white">evacuation plan for Sector 4</span> based
          on flood forecasts, shelter capacity and road closures.
        </p>

        <button
          type="button"
          onClick={() =>
            toast.success({
              title: "Opening evacuation plan",
              description: "Sector 4 plan — 412 residents · 2 shelters · 1 alternate route.",
            })
          }
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-severity-purple-400/20 px-4 py-2.5 text-sm font-bold text-severity-purple-200 ring-1 ring-severity-purple-400/50 transition hover:bg-severity-purple-400/30 hover:ring-severity-purple-300/70"
        >
          <FileText aria-hidden="true" className="h-4 w-4" />
          Review Plan
        </button>

        <p className="mt-3 text-[10px] leading-relaxed text-[var(--dl-text-muted)]">
          Generated 3 min ago · confidence 87% · human review recommended
        </p>
      </div>
    </section>
  );
}

export default AISuggestionsWidget;
