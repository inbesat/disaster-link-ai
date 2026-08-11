"use client";

// ---------------------------------------------------------------------
// components/gov/ai/PlannerLayout.tsx — Phase 9 · Step 1 · Split-Pane AI
// Workspace Shell.
//
// The outer shell of the Government AI Emergency Planner — a multi-agent
// orchestration workspace. Dark tactical theme (--bg-primary navy), with
// every AI-flavoured element carrying the signature #8b5cf6
// (--accent-purple) glow:
//
//   • 64px workspace header — back to Command Center, title, active
//     district chip, live agent status chips and a pulsing LIVE badge.
//   • Split-pane body (h-[calc(100vh-64px)]):
//       - Desktop (lg+): left pane 35% = chat interface, right pane
//         65% = plan visualization & map. Flexbox with explicit width
//         utilities so the split is exact.
//       - Mobile (<lg): the right pane hides behind a "View Live Plan"
//         toggle in the header. It is rendered ONCE — the same section
//         that lays out inline on desktop turns into a full-screen
//         fixed overlay when open (so the stateful plan component keeps
//         its state across open/close). Esc / Close / backdrop dismiss
//         it; a minimal focus trap keeps Tab inside the dialog and focus
//         returns to the toggle on close.
//
// Both panes are injected via `chat` / `plan` props so later Phase 9
// steps can swap in the real multi-agent chat and live map without
// touching the shell.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, MapPinned, Radio, Sparkles, X } from "lucide-react";

type PlannerLayoutProps = {
  /** Left pane — the multi-agent chat interface (35% on desktop). */
  chat: ReactNode;
  /** Right pane — plan visualization + live map (65% on desktop). */
  plan: ReactNode;
  /** Active district label rendered in the workspace header. */
  district?: string;
};

/** Agent roster surfaced in the header (multi-agent orchestration). */
const AGENTS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "planning", label: "Planning" },
  { id: "comms", label: "Comms" },
  { id: "logistics", label: "Logistics" },
];

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PlannerLayout({
  chat,
  plan,
  district = "Patna (Bihar)",
}: PlannerLayoutProps) {
  const [planOpen, setPlanOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  const closePlan = useCallback(() => {
    setPlanOpen(false);
    // Return focus to the "View Live Plan" toggle (desktop hides it, but
    // the button still exists in the DOM to receive focus safely).
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  // Esc dismisses the mobile live-plan overlay; Tab is trapped inside the
  // dialog while it is open.
  useEffect(() => {
    if (!planOpen) return;
    const dialog = dialogRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePlan();
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [planOpen, closePlan]);

  // Lock body scroll while the overlay is up.
  useEffect(() => {
    if (!planOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [planOpen]);

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-primary text-primary">
      {/* Ambient purple AI glow — top-right wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-accent-purple/10 blur-3xl"
      />

      {/* ------------------------------- 64px workspace header */}
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-[#0d1526]/95 px-3 backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/gov/dashboard"
            aria-label="Back to command center"
            title="Back to command center"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted transition hover:border-accent-purple/50 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </Link>

          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-purple/15 text-accent-purple shadow-[0_0_18px_rgba(139,92,246,0.35)]">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold leading-tight text-white">
                AI Emergency Planner
              </h1>
              <p className="hidden truncate text-[0.625rem] uppercase tracking-[0.18em] text-muted sm:block">
                Multi-agent orchestration · Government
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* Mobile-only "View Live Plan" toggle (the right pane hides
              behind this button below lg). */}
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setPlanOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={planOpen}
            aria-controls="planner-live-plan"
            className="inline-flex items-center gap-1.5 rounded-full bg-accent-purple/15 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-accent-purple ring-1 ring-accent-purple/40 shadow-[0_0_16px_rgba(139,92,246,0.25)] transition hover:bg-accent-purple/25 active:scale-95 lg:hidden"
          >
            <Radio className="h-3.5 w-3.5" aria-hidden />
            View Live Plan
          </button>

          {/* Active district chip */}
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.6875rem] font-semibold text-slate-200 md:inline-flex">
            <MapPinned className="h-3 w-3 text-accent" aria-hidden />
            {district}
          </span>

          {/* Agent status chips (multi-agent orchestration roster) */}
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
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-purple/40 bg-accent-purple/10 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider text-accent-purple shadow-[0_0_14px_rgba(139,92,246,0.25)]">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-purple"
              aria-hidden
            />
            Live
          </span>
        </div>
      </header>

      {/* ------------------------------- Split-pane workspace */}
      <div className="flex h-[calc(100vh-64px)] min-h-0 flex-col lg:flex-row">
        {/* Left pane — chat interface (35% desktop, full on mobile) */}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden lg:w-[35%] lg:flex-none lg:border-r lg:border-white/10">
          {chat}
        </section>

        {/* Right pane — plan visualization & map. ONE instance: inline
            flex child on desktop, and below lg it becomes the fixed
            full-screen overlay behind the "View Live Plan" toggle (its
            own state survives open/close because the node stays mounted,
            only its positioning classes change). */}
        <section
          ref={dialogRef}
          id="planner-live-plan"
          role={planOpen ? "dialog" : undefined}
          aria-modal={planOpen}
          aria-label={planOpen ? "Live plan" : undefined}
          className={
            planOpen
              ? "fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-primary lg:static lg:z-auto lg:flex lg:w-[65%] lg:flex-none"
              : "hidden min-h-0 flex-col overflow-hidden lg:flex lg:w-[65%] lg:flex-none"
          }
        >
          {planOpen && (
            <>
              {/* Backdrop (mobile overlay only) */}
              <div
                aria-hidden
                onClick={closePlan}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm lg:hidden"
              />
              {/* Overlay chrome (mobile only) */}
              <div className="relative flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#0d1526]/95 px-4 lg:hidden">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-purple">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Live Plan
                </span>
                <button
                  type="button"
                  onClick={closePlan}
                  autoFocus
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-accent-purple/50 hover:text-white active:scale-95"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Close
                </button>
              </div>
            </>
          )}

          <div className="relative min-h-0 flex-1 flex-col overflow-hidden flex animate-in fade-in slide-in-from-bottom-2 duration-200">
            {plan}
          </div>
        </section>
      </div>
    </div>
  );
}

export default PlannerLayout;
