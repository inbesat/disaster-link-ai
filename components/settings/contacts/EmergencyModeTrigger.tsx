"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/EmergencyModeTrigger.tsx — Contacts (Phase 7 · Step 8).
//
// Persistent Global Emergency Mode trigger:
//   • Highly visible red banner — "ACTIVATE EMERGENCY MODE".
//   • Tapping the banner does NOT activate instantly — it arms a
//     "Swipe to Confirm" slider (pointer drag or arrow keys) so pocket
//     triggers are impossible.
//   • On successful activation: the screen flashes red borders and a
//     massive toast fires: "🚨 EMERGENCY MODE ACTIVE: Location shared and
//     AI Planner engaged."
//   • A deactivate flow lets the demo loop cleanly.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, ChevronRight, Siren, X } from "lucide-react";

const ACTIVATE_THRESHOLD = 85; // % of the track the thumb must reach

export default function EmergencyModeTrigger() {
  const [armed, setArmed] = useState(false); // banner tapped → slider revealed
  const [active, setActive] = useState(false); // emergency mode ON (persistent)
  const [flash, setFlash] = useState(false); // red screen-border flash
  const [progress, setProgress] = useState(0); // 0–100 slider position

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  function arm() {
    setArmed(true);
  }

  function cancelArm() {
    draggingRef.current = false;
    setArmed(false);
    setProgress(0);
  }

  function activate() {
    if (active) return;
    setActive(true);
    setFlash(true);
    setArmed(false);
    setProgress(0);
    toast(
      "🚨 EMERGENCY MODE ACTIVE: Location shared and AI Planner engaged.",
      {
        duration: 6000,
        style: {
          background: "#7f1d1d",
          color: "#ffffff",
          fontWeight: 800,
          fontSize: "17px",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "2px solid #f87171",
          maxWidth: "480px",
          boxShadow: "0 0 40px rgba(220, 38, 38, 0.7)",
        },
      },
    );
  }

  function deactivate() {
    setActive(false);
    setFlash(false);
    toast("Emergency mode deactivated — resuming normal operations.", {
      duration: 3000,
    });
  }

  // Auto-dismiss the flashing border overlay after 8s so it never obscures
  // the rest of the demo; the active banner persists until deactivated.
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(false), 8000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  // ---- pointer drag on the confirm slider ---------------------------------
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function dragMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.min(
      100,
      Math.max(0, ((event.clientX - rect.left) / rect.width) * 100),
    );
    setProgress(pct);
    if (pct >= ACTIVATE_THRESHOLD) {
      draggingRef.current = false;
      activate();
    }
  }

  function endDrag() {
    draggingRef.current = false;
    // Snap back unless the swipe crossed the threshold.
    setProgress((p) => (p >= ACTIVATE_THRESHOLD ? p : 0));
  }

  // ---- keyboard support (role="slider") -----------------------------------
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = Math.min(100, progress + 25);
      setProgress(next);
      if (next >= ACTIVATE_THRESHOLD) activate();
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setProgress(Math.max(0, progress - 25));
    } else if (event.key === "Home") {
      event.preventDefault();
      setProgress(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setProgress(100);
      activate();
    }
  }

  return (
    <>
      {/* Flashing red screen borders right after activation */}
      {flash && (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
          <div className="absolute inset-0 animate-pulse border-8 border-red-600/80" />
          <div className="absolute inset-4 animate-pulse border-4 border-red-500/50 [animation-delay:150ms]" />
          <div className="absolute inset-0 bg-red-600/[0.04]" />
        </div>
      )}

      <section
        data-settings-key="contacts-emergencymode"
        className={`overflow-hidden rounded-eoc border-2 p-0 shadow-[0_0_30px_rgba(220,38,38,0.25)] transition ${
          active ? "border-red-400/70" : "border-red-600/60"
        }`}
      >
        {/* Idle banner */}
        {!armed && (
          <button
            type="button"
            onClick={active ? deactivate : arm}
            aria-label={active ? "Deactivate emergency mode" : "Activate emergency mode"}
            className={`group flex w-full items-center gap-4 bg-gradient-to-r p-5 text-left transition ${
              active
                ? "from-emerald-900/90 to-emerald-800/90"
                : "from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:via-red-500 hover:to-red-600"
            }`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
              <Siren
                className={`h-6 w-6 text-white ${active ? "" : "animate-pulse"}`}
                aria-hidden
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black uppercase tracking-wide text-white drop-shadow">
                {active ? "Emergency Mode Active" : "Activate Emergency Mode"}
              </span>
              <span className="mt-0.5 block text-xs font-medium text-white/80">
                {active
                  ? "Location shared · AI Planner engaged · tap to deactivate"
                  : "Tap to reveal swipe-to-confirm — prevents pocket triggers"}
              </span>
            </span>
            {active ? (
              <span className="shrink-0 rounded-md bg-white/15 px-3 py-2 text-sm font-bold text-white backdrop-blur-sm">
                Deactivate
              </span>
            ) : (
              <ChevronRight
                className="h-6 w-6 shrink-0 text-white/80 transition group-hover:translate-x-0.5"
                aria-hidden
              />
            )}
          </button>
        )}

        {/* Armed — swipe to confirm */}
        {armed && (
          <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 p-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-red-200" aria-hidden />
              <p className="text-sm font-bold uppercase tracking-wide text-white">
                Swipe to confirm — do not trigger accidentally
              </p>
              <button
                type="button"
                onClick={cancelArm}
                aria-label="Cancel emergency mode"
                className="ml-auto shrink-0 rounded-md bg-white/10 p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Slider track */}
            <div
              ref={trackRef}
              role="slider"
              tabIndex={0}
              aria-label="Swipe to confirm emergency mode"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              onPointerDown={startDrag}
              onPointerMove={dragMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={handleKeyDown}
              className="relative mt-4 h-14 w-full cursor-grab touch-none select-none overflow-hidden rounded-full border border-white/25 bg-black/30 outline-none focus-visible:ring-2 focus-visible:ring-white/70 active:cursor-grabbing"
            >
              {/* Fill */}
              <div
                className="absolute inset-y-0 left-0 bg-white/25 transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
              {/* Label */}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-widest text-white/90">
                Swipe to Confirm
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
              {/* Thumb */}
              <span
                className="pointer-events-none absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-[left] duration-75"
                style={{ left: `calc(${progress}% - 24px)` }}
              >
                <ChevronRight className="h-6 w-6 text-red-600" aria-hidden />
              </span>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
