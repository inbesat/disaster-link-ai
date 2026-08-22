"use client";

// ---------------------------------------------------------------------
// components/demo/QADrawer.tsx — Phase 15 · Step 9 · Q&A Anticipation.
//
// Off-canvas drawer that slides in from the right edge during the judges'
// Q&A, so the presenter has the visual aid for each anticipated question
// ONE keystroke away (Shift+4 → global "demo:toggle-qa" event from
// hooks/useDemoHotkeys.ts).
//
//   • "How do you handle offline?"  → a live render of the PWA Lite mode
//     (/lite — the actual feature-phone page, embedded so it's always
//     truthful) plus the SMS fallback + service-worker cache story.
//   • "What about Data Privacy?"    → the REAL Postgres RLS policy from
//     supabase/migrations/0017_rls_policies.sql + the posture bullets.
//   • "How does the AI work?"       → a LangGraph multi-agent flow diagram.
//
// Mount once at the app root (app/layout.tsx). Renders nothing until the
// hotkey fires; closes on Esc, backdrop click, or the ✕ button.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, Phone, ShieldCheck, BrainCircuit } from "lucide-react";

const RLS_SNIPPET = `-- Postgres Row-Level Security (supabase/migrations/0017)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select ON public.users
FOR SELECT USING (
  id = auth.uid()
  OR current_user_role() = 'super_admin'
  OR (current_user_role() = 'district_admin'
      AND district = current_user_district())
);`;

const AGENT_FLOW = [
  { label: "Signal Ingestion", sub: "SMS · social · weather · gauge", tone: "border-sky-400/60" },
  { label: "Flood Prediction", sub: "xgboost · 24h horizon · confidence", tone: "border-cyan-400/60" },
  { label: "Alert Orchestrator", sub: "multi-channel fan-out", tone: "border-amber-400/60" },
  { label: "Allocation Optimizer", sub: "boats · med-kits · teams", tone: "border-emerald-400/60" },
  { label: "Field Dispatch", sub: "gov dashboard + citizen app", tone: "border-rose-400/60" },
];

type FaqKey = "offline" | "privacy" | "ai";

export default function QADrawer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<FaqKey | null>("offline");

  useEffect(() => {
    const onToggle = () => setOpen((v) => !v);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Escape") setOpen(false);
    };
    window.addEventListener("demo:toggle-qa", onToggle);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("demo:toggle-qa", onToggle);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const toggle = (key: FaqKey) => setActive((current) => (current === key ? null : key));

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Q&A anticipation drawer">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-[440px] max-w-[94vw] flex-col border-l border-white/10 bg-primary text-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-eoc-tiny font-bold uppercase tracking-[0.28em] text-cyan-300">
                  Anticipation
                </p>
                <h2 className="mt-1 text-xl font-black leading-tight">Q&A Drawer</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Judge questions, answered with the visual aid already on screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </header>

            <div className="flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
              {/* 1 — OFFLINE */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => toggle("offline")}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                    active === "offline" ? "bg-white/5" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                    <span className="text-sm font-bold">How do you handle offline?</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      active === "offline" ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {active === "offline" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
                        {/* Live Lite-mode render — a truthful "screenshot". */}
                        <div className="mx-auto w-fit overflow-hidden rounded-xl border border-white/15 shadow-[var(--shadow-float-xl)]">
                          <div className="bg-panel-deep px-3 py-1.5 text-center text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                            PWA Lite Mode — /lite
                          </div>
                          <iframe
                            title="Lite mode"
                            src="/lite"
                            className="h-[300px] w-[230px] border-0"
                          />
                        </div>
                        <ul className="space-y-1.5 text-xs leading-snug text-slate-300">
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-sky-400" />
                            Feature-phone / no-JS page with zero client hooks.
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-sky-400" />
                            SMS fallback — text{" "}
                            <code className="rounded bg-white/10 px-1 font-mono text-eoc-tiny">STATUS</code>{" "}
                            or{" "}
                            <code className="rounded bg-white/10 px-1 font-mono text-eoc-tiny">SAFE</code>
                            .
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-sky-400" />
                            Service worker caches shelters/alerts for offline reads.
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2 — DATA PRIVACY */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => toggle("privacy")}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                    active === "privacy" ? "bg-white/5" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
                    <span className="text-sm font-bold">What about Data Privacy?</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      active === "privacy" ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {active === "privacy" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-white/10 px-4 pb-4 pt-3">
                        <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-[10.5px] leading-relaxed text-slate-300">
                          <span className="text-emerald-400">{RLS_SNIPPET}</span>
                        </pre>
                        <ul className="space-y-1.5 text-xs leading-snug text-slate-300">
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-emerald-400" />
                            RLS is enforced by Postgres itself — not by app code.
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-emerald-400" />
                            District scoping — a Patna admin never sees another district.
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-emerald-400" />
                            Citizens may only insert their own crowdsourced reports.
                          </li>
                          <li className="flex gap-2">
                            <span className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-emerald-400" />
                            Data export + full account deletion under /settings/privacy.
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3 — HOW THE AI WORKS */}
              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => toggle("ai")}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
                    active === "ai" ? "bg-white/5" : ""
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <BrainCircuit className="h-4 w-4 shrink-0 text-purple-300" aria-hidden />
                    <span className="text-sm font-bold">How does the AI work?</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      active === "ai" ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <AnimatePresence initial={false}>
                  {active === "ai" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2 border-t border-white/10 px-4 pb-4 pt-3">
                        <p className="text-eoc-tiny font-bold uppercase tracking-[0.22em] text-slate-500">
                          LangGraph multi-agent flow
                        </p>
                        {AGENT_FLOW.map((node, i) => (
                          <div key={node.label}>
                            <div
                              className={`flex items-center justify-between rounded-lg border-l-[3px] bg-black/40 px-3 py-2 ${node.tone}`}
                            >
                              <div>
                                <p className="text-xs font-bold">{node.label}</p>
                                <p className="text-eoc-tiny text-slate-400">{node.sub}</p>
                              </div>
                              <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                agent
                              </span>
                            </div>
                            {i < AGENT_FLOW.length - 1 && (
                              <div className="flex justify-center py-0.5" aria-hidden>
                                <span className="text-xs text-slate-500">↓</span>
                              </div>
                            )}
                          </div>
                        ))}
                        <p className="pt-1 text-[11px] leading-snug text-slate-400">
                          Stateful graph — each agent proposes, a coordinator agent approves,
                          so humans stay in the loop at every step.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <footer className="border-t border-white/10 px-5 py-3 text-center text-[11px] text-slate-500">
              Shift+4 · closes on Esc — keep the visual aid on screen while you talk.
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}