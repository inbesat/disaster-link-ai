"use client";

// ---------------------------------------------------------------------
// components/dashboard/AIPlannerWidget.tsx — UI/UX Phase 4 · Step 6.
//
// "AI Commander Advice" preview card. Renders the planner's latest
// proactive suggestion with a purple bot identity, a full-width
// "Open AI Planner" CTA in the footer, and inline thumbs feedback.
// ---------------------------------------------------------------------

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, ThumbsUp, ThumbsDown } from "lucide-react";
import Panel from "@/components/ui/Panel";
import IconButton from "@/components/ui/IconButton";

const MOCK_RECOMMENDATION =
  "Evacuate villages Ghagha, Sonepur and Rampur within 4 hours. 3 shelters with 1,240 free berths available within 6 km.";

export function AIPlannerWidget() {
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  return (
    <Panel
      className="glow-purple-soft"
      title={
        <span className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(168,85,247,0.15)] text-purple-400">
            <Bot className="h-4 w-4" aria-hidden />
          </span>
          <span>AI Commander Advice</span>
        </span>
      }
      footer={
        <div className="flex items-center gap-2">
          <Link
            href="/ai-planner"
            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-accent-primary text-sm font-semibold text-white shadow-glow-blue transition hover:opacity-90 hover:shadow-none"
          >
            Open AI Planner
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <IconButton
            label="Approve AI plan"
            size="sm"
            variant="ghost"
            aria-pressed={feedback === "up"}
            className={
              feedback === "up"
                ? "border border-accent-success/50 text-accent-success"
                : ""
            }
            onClick={() => setFeedback(feedback === "up" ? null : "up")}
          >
            <ThumbsUp className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton
            label="Reject AI plan"
            size="sm"
            variant="ghost"
            aria-pressed={feedback === "down"}
            className={
              feedback === "down"
                ? "border border-accent-danger/50 text-accent-danger"
                : ""
            }
            onClick={() => setFeedback(feedback === "down" ? null : "down")}
          >
            <ThumbsDown className="h-4 w-4" aria-hidden />
          </IconButton>
        </div>
      }
    >
      <div className="rounded-md border border-purple-500/20 bg-purple-500/5 p-4">
        <p className="text-sm leading-relaxed text-slate-100">
          <span className="font-semibold text-purple-300">Advisory:</span>{" "}
          {MOCK_RECOMMENDATION}
        </p>
        <p className="mt-2 text-[11px] text-muted">
          Suggested by Emergency Planner · Confidence 94%
        </p>
      </div>
    </Panel>
  );
}

export default AIPlannerWidget;
