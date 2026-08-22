"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlannerLayout.tsx — Phase 9 · Step 1 · Split-Pane AI
// Workspace Shell.
//
// The outer shell of the Government AI Emergency Planner — a multi-agent
// orchestration workspace. Dark tactical theme with purple (#8b5cf6) accent.
//
//   • 56px workspace header — back to Command Center, title, active
//     district chip, live agent status chips and a pulsing LIVE badge.
//   • Split-pane body (h-[calc(100vh-56px)]):
//       - Desktop (lg+): left pane default 35% = chat interface, right
//         pane default 65% = plan visualization & map. Resizable divider
//         (drag to adjust, 200px-800px range).
//       - Mobile (<lg): tab switcher between Chat and Plan views.
// ---------------------------------------------------------------------

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  FileText,
  MapPinned,
  Radio,
  Sparkles,
} from "lucide-react";

type PlannerLayoutProps = {
  /** Left pane — the multi-agent chat interface. */
  chat: ReactNode;
  /** Right pane — plan visualization + live map. */
  plan: ReactNode;
  /** Active district label rendered in the workspace header. */
  district?: string;
};

/** Agent roster surfaced in the header. */
const AGENTS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "planning", label: "Planning" },
  { id: "comms", label: "Comms" },
  { id: "logistics", label: "Logistics" },
];

const MIN_LEFT = 200;
const MAX_LEFT = 800;
const DEFAULT_SPLIT = 35; // percent

export function PlannerLayout({
  chat,
  plan,
  district = "Patna (Bihar)",
}: PlannerLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitPct, setSplitPct] = useState(DEFAULT_SPLIT);
  const [dragging, setDragging] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "plan">("chat");
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // ── Resizable divider drag handlers ──
  const onDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      setDragging(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = container.clientWidth;
    },
    [],
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const dx = e.clientX - dragStartX.current;
      const newWidth = Math.min(
        MAX_LEFT,
        Math.max(MIN_LEFT, (dragStartWidth.current * DEFAULT_SPLIT) / 100 + dx),
      );
      const pct = (newWidth / dragStartWidth.current) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
    };

    const onUp = () => setDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0f1a] text-white">
      {/* Ambient purple AI glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl"
      />

      {/* ── 56px Workspace Header ── */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0a0f1a]/95 px-3 backdrop-blur-md sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/gov/dashboard"
            aria-label="Back to command center"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-purple-400/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 shadow-[0_0_18px_rgba(139,92,246,0.35)]">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight text-white">
                AI Emergency Planner
              </h1>
              <p className="hidden truncate text-[0.625rem] uppercase tracking-[0.18em] text-slate-500 sm:block">
                Multi-agent orchestration · Government
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Active district chip */}
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-slate-200 md:inline-flex">
            <MapPinned className="h-3 w-3 text-purple-400" aria-hidden />
            {district}
          </span>

          {/* Agent status chips */}
          <div className="hidden items-center gap-1.5 lg:flex" aria-label="Agent status">
            {AGENTS.map((agent) => (
              <span
                key={agent.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-wider text-slate-300"
              >
                <span className="relative flex h-1.5 w-1.5" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {agent.label}
              </span>
            ))}
          </div>

          {/* Live badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-400/40 bg-purple-400/10 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-purple-400 shadow-[0_0_14px_rgba(139,92,246,0.25)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400" aria-hidden />
            Live
          </span>
        </div>
      </header>

      {/* ── Mobile Tab Switcher ── */}
      <div className="flex border-b border-white/10 bg-[#0a0f1a]/95 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition ${
            mobileTab === "chat"
              ? "border-b-2 border-purple-400 text-purple-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Bot className="h-3.5 w-3.5" aria-hidden />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("plan")}
          className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider transition ${
            mobileTab === "plan"
              ? "border-b-2 border-purple-400 text-purple-400"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Plan
        </button>
      </div>

      {/* ── Split-pane workspace ── */}
      <div
        ref={containerRef}
        className="flex h-[calc(100vh-56px)] min-h-0 flex-col lg:flex-row"
        style={{ cursor: dragging ? "col-resize" : undefined }}
      >
        {/* Left pane — chat interface */}
        <section
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            mobileTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
          style={{
            // @ts-expect-error CSS custom property
            "--split": `${splitPct}%`,
          }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:w-[var(--split)]">
            {chat}
          </div>
        </section>

        {/* Resizable divider (desktop only) */}
        <div
          role="separator"
          aria-valuenow={splitPct}
          aria-valuemin={20}
          aria-valuemax={80}
          aria-label="Resize chat and plan panels"
          tabIndex={0}
          onMouseDown={onDividerMouseDown}
          onKeyDown={(e) => {
            const step = 2;
            if (e.key === "ArrowLeft") setSplitPct((p) => Math.max(20, p - step));
            if (e.key === "ArrowRight") setSplitPct((p) => Math.min(80, p + step));
          }}
          className={`hidden w-1.5 shrink-0 cursor-col-resize bg-white/5 transition-colors hover:bg-purple-400/30 lg:block ${
            dragging ? "bg-purple-400/40" : ""
          }`}
        >
          {/* Grip handle */}
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-0.5 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Right pane — plan visualization & map */}
        <section
          className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
            mobileTab === "plan" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {plan}
          </div>
        </section>
      </div>

      {/* Drag overlay to prevent pointer-events loss during fast drags */}
      {dragging && <div className="fixed inset-0 z-50 cursor-col-resize" />}
    </div>
  );
}

export default PlannerLayout;
