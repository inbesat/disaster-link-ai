"use client";

// ---------------------------------------------------------------------
// components/settings/ai/AiSettingsWrapper.tsx — AI Assistant (Phase 4 · Step 1).
//
// Responsive, scrollable layout for /settings/ai. Renders the page header
// and a clean CSS grid ready to hold the upcoming configuration cards:
//   • Model & provider selection
//   • Response style / personality
//   • Safety guardrails
//   • Tool permissions
//   • Chat history & memory
//
// The grid keeps cards side-by-side on wide screens and stacks them on
// mobile, following the dark emergency-ops theme used across settings.
// ---------------------------------------------------------------------

import { BotMessageSquare, Sparkles } from "lucide-react";
import ModelPreferencesCard from "@/components/settings/ai/ModelPreferencesCard";
import ResponseStyleCard from "@/components/settings/ai/ResponseStyleCard";
import ToolAccessCard from "@/components/settings/ai/ToolAccessCard";
import PlanApprovalCard from "@/components/settings/ai/PlanApprovalCard";
import ConversationMemoryCard from "@/components/settings/ai/ConversationMemoryCard";
import RagSourcesCard from "@/components/settings/ai/RagSourcesCard";
import FeedbackLoopCard from "@/components/settings/ai/FeedbackLoopCard";

export default function AiSettingsWrapper() {
  return (
    <div className="space-y-6" data-settings-scope="ai">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eoc-label flex items-center gap-2 text-fuchsia-400/90">
            <BotMessageSquare className="h-3.5 w-3.5" aria-hidden />
            SETTINGS / AI ASSISTANT
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            AI Assistant &amp; LLM Preferences
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Configure the operational parameters, safety guardrails, and
            personality of your AI Command Assistant.
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/10">
          <Sparkles className="h-5 w-5 text-fuchsia-300" aria-hidden />
        </div>
      </div>

      {/* Configuration card grid — upcoming cards drop into these cells */}
      <div
        className="grid gap-6 lg:grid-cols-2"
        aria-label="AI configuration"
        data-settings-ai-grid
      >
        <ModelPreferencesCard />
        <ResponseStyleCard />
        <ToolAccessCard />
      </div>

      {/* Plan Execution & Approval — full width for prominence */}
      <PlanApprovalCard />

      {/* Conversation Memory — full width */}
      <ConversationMemoryCard />

      {/* RAG Source Preferences — full width */}
      <RagSourcesCard />

      {/* AI Feedback Loop — full width */}
      <FeedbackLoopCard />
    </div>
  );
}