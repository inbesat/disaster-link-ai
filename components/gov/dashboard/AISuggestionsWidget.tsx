"use client";

import { useState } from "react";
import { Brain, FileText, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/useToast";

// ---------------------------------------------------------------------
// components/gov/dashboard/AISuggestionsWidget.tsx — Phase 7 · Step 6.
//
// 1×1 machine-intelligence widget. A glowing purple border marks the AI
// suggestion as something the command staff should review. "Open AI
// Planner" button, thumbs up/down feedback. Empty state shows animated
// brain icon with "AI is monitoring..." message.
// ---------------------------------------------------------------------

export function AISuggestionsWidget() {
  const toast = useToast();
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  return (
    <section className="relative flex flex-col overflow-hidden rounded-xl border border-purple-400/50 border-l-4 border-l-purple-400 bg-[#111827] p-5 shadow-[0_0_28px_rgba(192,132,252,0.18)] backdrop-blur transition hover:border-purple-300/70 hover:shadow-[0_0_38px_rgba(192,132,252,0.28)]">
      {/* Ambient purple glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-purple-400/20 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-400/15 text-purple-300">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          </span>
          <p className="eoc-label text-purple-300">AI SUGGESTION</p>
        </div>

        <p className="mt-3 text-[0.8125rem] leading-relaxed text-white/85">
          Evacuate villages{" "}
          <span className="font-semibold text-white">X, Y, Z within 4 hours</span>. 3
          shelters available. Route via NH-31 northbound.
        </p>

        <button
          type="button"
          onClick={() =>
            toast.success({
              title: "Opening AI evacuation planner",
              description: "Sector 4 plan — 412 residents · 2 shelters · 1 alternate route.",
            })
          }
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-500/20 px-4 py-2.5 text-sm font-bold text-purple-200 ring-1 ring-purple-400/50 transition hover:bg-purple-500/30 hover:ring-purple-300/70 hover:shadow-[0_0_12px_rgba(192,132,252,0.25)]"
        >
          <FileText aria-hidden="true" className="h-4 w-4" />
          Open AI Planner
        </button>

        {/* Feedback buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedback("up")}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              feedback === "up"
                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
            }`}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            Helpful
          </button>
          <button
            type="button"
            onClick={() => setFeedback("down")}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              feedback === "down"
                ? "border-red-400/40 bg-red-400/15 text-red-300"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-red-400/30 hover:bg-red-400/10 hover:text-red-300"
            }`}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            Not helpful
          </button>
        </div>

        <p className="mt-3 text-[0.625rem] leading-relaxed text-slate-500">
          Generated 3 min ago · confidence 87% · human review recommended
        </p>
      </div>
    </section>
  );
}

export function AISuggestionsEmptyState() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-purple-400/30 border-l-4 border-l-purple-400 bg-[#111827] p-8 shadow-[0_0_20px_rgba(192,132,252,0.1)] backdrop-blur">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-400/15">
        <Brain className="h-8 w-8 text-purple-400 animate-pulse" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white/80">AI is monitoring…</p>
      <p className="mt-1 text-xs text-slate-500">No active suggestions right now</p>
    </section>
  );
}

export default AISuggestionsWidget;
