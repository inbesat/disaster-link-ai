"use client";

// ---------------------------------------------------------------------
// components/settings/ai/PlanApprovalCard.tsx — AI Assistant (Phase 4 · Step 5).
//
// "Plan Execution & Approval" — human-in-the-loop execution safety:
//   • Auto-Execute — AI plans go live and dispatch immediately.
//   • Suggest-Only (Recommended) — drafts require Commander approval.
//   • Disabled — assistant is a chat-only, plan-free bot.
//
// "Suggest-Only" is the organizational standard, highlighted with a green
// border. Persisted via useAiSettings → localStorage.
// ---------------------------------------------------------------------

import {
  Bot,
  Gavel,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { useAiSettings } from "@/lib/settings/AiSettingsContext";
import type { PlanExecutionMode } from "@/lib/settings/ai-settings";

const MODES: {
  value: PlanExecutionMode;
  label: string;
  description: string;
  recommended?: boolean;
  icon: typeof Rocket;
}[] = [
  {
    value: "auto",
    label: "Auto-Execute",
    description:
      "AI plans go live and dispatch resources immediately.",
    icon: Rocket,
  },
  {
    value: "suggest",
    label: "Suggest-Only",
    description:
      "AI drafts plans, but requires human Commander authorization before anything goes live.",
    recommended: true,
    icon: Gavel,
  },
  {
    value: "disabled",
    label: "Disabled",
    description:
      "AI acts only as a chatbot and cannot draft operational plans.",
    icon: Bot,
  },
];

export default function PlanApprovalCard() {
  const { settings, update } = useAiSettings();
  const mode = settings.planExecutionMode;

  function setMode(value: PlanExecutionMode) {
    update({ planExecutionMode: value });
  }

  return (
    <section
      data-settings-key="ai-plan-approval"
      className="rounded-eoc border-2 border-amber-400/30 bg-surface p-5 shadow-[0_0_40px_-18px_rgba(245,158,11,0.35)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
          <ShieldCheck className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <div>
          <p className="eoc-label text-amber-300/90">EXECUTION SAFETY</p>
          <h2 className="mt-0.5 text-lg font-bold">Plan Execution &amp; Approval</h2>
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        Choose how much autonomy the assistant gets over live operations.
        This is the single highest-impact safety control on this page.
      </p>

      {/* Radio group */}
      <div
        className="mt-5 space-y-3"
        role="radiogroup"
        aria-label="Plan approval mode"
      >
        {MODES.map(({ value, label, description, recommended, icon: Icon }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setMode(value)}
              className={`flex w-full items-start gap-3 rounded-md border-2 p-4 text-left transition ${
                active
                  ? recommended
                    ? "border-green-400 bg-green-500/[0.08]"
                    : "border-amber-400 bg-amber-500/10"
                  : recommended
                    ? "border-green-400/40 bg-surface-muted/40 hover:border-green-400"
                    : "border-panel-border bg-surface-muted/40 hover:border-amber-400/40"
              }`}
            >
              <span
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  active
                    ? recommended
                      ? "border-green-400"
                      : "border-amber-400"
                    : "border-slate-500"
                }`}
              >
                {active && (
                  <span
                    className={`h-2 w-2 rounded-full ${
                      recommended ? "bg-green-400" : "bg-amber-400"
                    }`}
                  />
                )}
              </span>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Icon
                    className={`h-4 w-4 ${active ? (recommended ? "text-green-300" : "text-amber-300") : "text-slate-500"}`}
                    aria-hidden
                  />
                  <p className="text-sm font-bold text-slate-200">{label}</p>
                  {recommended && (
                    <span className="rounded-full border border-green-400/40 bg-green-500/10 px-2 py-0.5 text-eoc-tiny font-bold uppercase tracking-wide text-green-300">
                      Recommended · Org standard
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dynamic status strip */}
      <div
        className={`mt-4 flex items-center gap-2 rounded-md border p-3 ${
          mode === "auto"
            ? "border-red-400/40 bg-red-500/[0.07]"
            : mode === "suggest"
              ? "border-green-400/40 bg-green-500/[0.07]"
              : "border-panel-border bg-[#0a0f1a]"
        }`}
      >
        <IconByMode mode={mode} />
        <p className="text-[11px] font-medium leading-relaxed text-slate-400">
          {mode === "auto" &&
            "Caution: resources may be dispatched without a Commander review."
          }
          {mode === "suggest" &&
            "All drafted plans are queued for Commander authorization before execution."
          }
          {mode === "disabled" &&
            "The assistant cannot draft operational plans and acts as chat-only."
          }
        </p>
      </div>
    </section>
  );
}

function IconByMode({ mode }: { mode: PlanExecutionMode }) {
  const className = "h-4 w-4 shrink-0";
  if (mode === "auto") {
    return <Rocket className={`${className} text-red-300`} aria-hidden />;
  }
  if (mode === "suggest") {
    return <Gavel className={`${className} text-green-300`} aria-hidden />;
  }
  return <Bot className={`${className} text-slate-500`} aria-hidden />;
}