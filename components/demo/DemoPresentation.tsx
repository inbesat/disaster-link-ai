"use client";

// ---------------------------------------------------------------------
// components/demo/DemoPresentation.tsx — Phase 15 · Step 2.
//
// Side-by-side presentation mode for the live pitch: both the Citizen App
// and the Gov Command Center on ONE projector screen, interacting with
// the same backend in real time.
//
//   • Left  — a CSS phone frame embedding /public/dashboard
//   • Right — a desktop browser frame embedding /gov/dashboard
//   • Dark presentation backdrop with a slim title strip.
//
// Session handling: the two iframes share the parent browser's cookies,
// and the app's dual-mode middleware otherwise forces ONE identity per
// browser (a gov cookie bounces /public/* and vice-versa). On mount this
// component calls GET /api/demo/session which normalises the browser to
// guest mode — the only identity under which BOTH dashboards render.
// Once the session is confirmed the iframes mount (keyed by session
// state so they always load fresh after the cookie lands).
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";
import { Smartphone, Monitor, RefreshCw, Radio } from "lucide-react";
import ScreenRecorder from "@/components/demo/ScreenRecorder";

export default function DemoPresentation() {
  // Frames mount immediately (no dark void on first paint). Once the
  // session API confirms guest mode, the key bumps so both iframes reload
  // with the normalized cookies — the presenter sees them settle in.
  const [stamp, setStamp] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/demo/session", { cache: "no-store" })
      .then(() => {
        if (!cancelled) setStamp((s) => s + 1);
      })
      .catch(() => {
        /* cookies may already be fine — frames stay mounted */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Manual refresh — lets the presenter replay an interaction between
  // practice runs without leaving the presentation.
  const reload = () => setStamp((s) => s + 1);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#060b16] text-white">
      {/* Title strip */}
      <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-[#0b1120] via-[#0d1526] to-[#0b1120] px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-500/10 text-cyan-300">
            <Radio className="h-5 w-5" aria-hidden />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-black tracking-tight">DRIP — Live Demo</p>
            <p className="text-xs text-slate-400">
              SafeSphere Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-red-400/60 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
            {ready ? "Live" : "Preparing session…"}
          </span>
          <button
            type="button"
            onClick={reload}
            className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh both
          </button>
        </div>
      </header>

      {/* Split screen — 50/50 */}
      <main className="flex min-h-0 flex-1 items-stretch justify-center gap-6 overflow-hidden p-6">
        {/* LEFT — phone frame */}
        <section className="flex flex-col items-center gap-3" aria-label="Citizen App preview">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300">
            <Smartphone className="h-4 w-4" aria-hidden />
            Citizen App
          </div>
          <div className="relative h-full max-h-[760px] w-[320px] shrink-0 rounded-[2.6rem] border-2 border-white/15 bg-black p-2 shadow-[0_20px_80px_rgba(0,0,0,0.6)] sm:w-[360px]">
            {/* Notch */}
            <div className="absolute left-1/2 top-3 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />
            <iframe
              key={`pub-${stamp}-${ready}`}
              title="Citizen App"
              src="/public/dashboard"
              className="h-full w-full rounded-[2.1rem] border border-white/10 bg-[var(--brand-navy)]"
            />
          </div>
        </section>

        {/* RIGHT — desktop frame */}
        <section className="flex min-w-0 flex-1 flex-col items-stretch gap-3" aria-label="Gov dashboard preview">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300">
            <Monitor className="h-4 w-4" aria-hidden />
            Gov Command Center
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-2 border-white/15 bg-primary shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
            {/* Faux browser chrome */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-panel-deep px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-1 font-mono text-xs text-slate-400">
                app.drip.gov.in/gov/dashboard
              </div>
            </div>
            <iframe
              key={`gov-${stamp}-${ready}`}
              title="Gov Command Center"
              src="/gov/dashboard"
              className="min-h-0 flex-1 border-0 bg-primary"
            />
          </div>
        </section>
      </main>

      {/* Footer hint */}
      <footer className="border-t border-white/10 px-6 py-2 text-center text-xs text-slate-500">
        Both apps share the same live backend · opening this screen switches
        this browser to guest mode (both dashboards render under it) · reset
        the hero scenario between runs with{" "}
        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-cyan-300">npm run demo:reset</code>
      </footer>

      {/* Phase 15 · Step 8 — hidden highlight-reel recorder: an almost
          invisible red dot bottom-right; click to record, click again to
          download the .webm pitch flow. */}
      <ScreenRecorder />
    </div>
  );
}
