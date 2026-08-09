"use client";

// ---------------------------------------------------------------------
// app/(dashboard)/ai-advisor/page.tsx — UI/UX Phase 6 · Step 1.
//
// AI Command Advisor split-pane workspace. On desktop the chat thread owns
// 40% and the live plan visualization 60% (flex, side by side). On mobile a
// sticky tab bar ("Chat" | "Live Plan") toggles which pane is visible.
// Heights are the specified h-[calc(100vh-56px)] full-height workspace.
// ---------------------------------------------------------------------

import { useState } from "react";
import ChatThread from "@/components/ai/ChatThread";
import ChatHistorySidebar from "@/components/ai/ChatHistorySidebar";
import PlanVisualization from "@/components/ai/PlanVisualization";

type AdvisorTab = "chat" | "plan";

export default function AiAdvisorPage() {
  const [tab, setTab] = useState<AdvisorTab>("chat");
  const [historyOpen, setHistoryOpen] = useState(false);

  const tabButton = (id: AdvisorTab, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`flex-1 border-b-2 py-2.5 text-sm font-semibold transition ${
        tab === id
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative flex h-[calc(100vh-56px)] flex-col bg-[#0a0f1a] text-foreground">
      {/* Mobile-only sticky tab bar */}
      <div className="sticky top-0 z-20 flex border-b border-border bg-[#0a0f1a]/95 backdrop-blur md:hidden">
        {tabButton("chat", "Chat")}
        {tabButton("plan", "Live Plan")}
      </div>

      {/* Split panes */}
      <div className="flex min-h-0 flex-1">
        {/* Left — chat thread (40% desktop) */}
        <section
          className={`${
            tab === "chat" ? "flex" : "hidden"
          } min-h-0 w-full flex-col md:flex md:w-[40%] md:shrink-0 md:border-r md:border-border`}
        >
          <ChatThread onHistoryToggle={() => setHistoryOpen((o) => !o)} />
        </section>

        {/* Right — plan visualization (60% desktop) */}
        <section
          className={`${
            tab === "plan" ? "flex" : "hidden"
          } min-h-0 flex-1 flex-col bg-[#111827] md:flex`}
          aria-label="Plan visualization"
        >
          <PlanVisualization />
        </section>
      </div>

      {/* Step 9 — chat history: desktop column / mobile slide-over */}
      {historyOpen && (
        <div className="hidden lg:block">
          <div className="absolute inset-y-0 left-0 z-30 w-64 border-r border-border">
            <ChatHistorySidebar onClose={() => setHistoryOpen(false)} />
          </div>
        </div>
      )}
      {historyOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            aria-label="Close chat history"
            onClick={() => setHistoryOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] border-r border-border shadow-2xl">
            <ChatHistorySidebar onClose={() => setHistoryOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
