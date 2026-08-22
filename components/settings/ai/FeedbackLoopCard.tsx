"use client";

// ---------------------------------------------------------------------
// components/settings/ai/FeedbackLoopCard.tsx — AI Assistant (Phase 4 · Step 8).
//
// Continuous-learning controls:
//   • "Enable AI Feedback Loop" toggle — opt-in sharing of ratings and
//     corrected evacuation plans with the engineering team.
//   • Subtext describing anonymization & PII stripping.
//   • Link to the AI Privacy Policy.
// ---------------------------------------------------------------------

import { ExternalLink, HandHeart, Share2 } from "lucide-react";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";

export default function FeedbackLoopCard() {
  const { settings, update } = useAiSettings();
  const on = settings.feedbackLoop;

  function toggle() {
    update({ feedbackLoop: !on });
  }

  return (
    <section
      data-settings-key="ai-feedback-loop"
      className="rounded-eoc border border-panel-border bg-surface p-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
          <HandHeart className="h-5 w-5 text-emerald-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-emerald-300/80">CONTINUOUS LEARNING</p>
          <h2 className="mt-0.5 text-lg font-bold">AI Feedback Loop</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Help the assistant improve over time by sharing how your crews
        actually used it during live operations.
      </p>

      {/* Toggle row */}
      <div className="mt-5 rounded-md border border-panel-border bg-surface-muted/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-500/10">
              <Share2 className="h-4 w-4 text-emerald-300" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Enable AI Feedback Loop
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Opt-in — never enabled without your consent.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            aria-label="Toggle AI feedback loop"
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              on ? "bg-emerald-500" : "bg-[#2c3f6d]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                on ? "translate-x-[22px]" : "-translate-x-[2px]"
              }`}
            />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-slate-400">
          Share your thumbs up/down ratings and manually corrected evacuation
          plans with our engineering team to improve the underlying model. All
          data is heavily anonymized and stripped of PII before transmission.
        </p>
      </div>

      {/* Privacy policy link */}
      <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-panel-border bg-[#0a0f1a] p-3">
        <p className="text-[11px] text-slate-500">
          Read how feedback data is collected, used and protected.
        </p>
        <a
          href="/legal/ai-privacy"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-emerald-300 transition hover:text-emerald-200"
        >
          AI Privacy Policy
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </section>
  );
}