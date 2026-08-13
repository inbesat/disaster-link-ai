"use client";

// ---------------------------------------------------------------------
// components/public/CriticalAlertOverlay.tsx — Phase 3 · Step 3 ·
// Critical Alert full-screen takeover.
//
// When a life-threatening flood is imminent we interrupt the citizen:
// a fixed full-screen red overlay (z-[9999]) with a pulsing "EVACUATE
// NOW" headline, a mock countdown ("Flood expected in 04:00:00") that
// ticks down live, and two massive bottom CTAs — "Show Me Where to Go"
// (primary) and "I Need Help / SOS" (secondary dark).
//
// On mount it fires triggerCriticalHaptic() — navigator.vibrate([500,
// 200, 500]) — a long-buzz-pause-long-buzz pattern strong enough to be
// felt from a pocket (new dedicated trigger in hooks/useHaptics).
//
// The component is prop-driven and renders nothing when `open` is false.
// The alerts page owns the conditional logic (auto-open once per session
// when a critical alert exists; see app/public/alerts/page.tsx).
//
// Modal conventions follow FamilyStrip/ShortcutModal: role="dialog" +
// aria-modal, focus moved into the panel, Esc / Dismiss button to close,
// body scroll-lock while open, MotionConfig reducedMotion="user".
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { MapPin, PhoneCall, Square, Volume2, X } from "lucide-react";
import { triggerCriticalHaptic } from "@/hooks/useHaptics";
import { stopSpeaking, useTextToSpeech } from "@/hooks/useTextToSpeech";
import { announceAlert } from "@/lib/audio/alert-announcer";
import { formatCountdown } from "@/lib/alerts/countdown";

/** Default countdown — 4 hours to flood, per the spec ("04:00:00"). */
const DEFAULT_COUNTDOWN_SECONDS = 4 * 60 * 60;

/** sessionStorage flag the page sets once the takeover is dismissed, so it
 * only interrupts once per tab session instead of on every render/nav. */
export const CRITICAL_OVERLAY_SESSION_KEY = "drip:critical-overlay-seen";

export type CriticalAlertOverlayProps = {
  /** Render gate — the page decides when to interrupt. */
  open: boolean;
  /** Called when the citizen dismisses (Esc / Dismiss). */
  onDismiss: () => void;
  /** Called when either CTA is tapped — pages persist dismissal too. */
  onAction?: () => void;
  /** Override the mock countdown length (seconds). */
  countdownSeconds?: number;
};

export function CriticalAlertOverlay({
  open,
  onDismiss,
  onAction,
  countdownSeconds = DEFAULT_COUNTDOWN_SECONDS,
}: CriticalAlertOverlayProps) {
  const [remaining, setRemaining] = useState(countdownSeconds);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { speak, stop, speaking, supported } = useTextToSpeech();

  // Reset the mock clock whenever the overlay (re)opens.
  useEffect(() => {
    if (open) setRemaining(countdownSeconds);
  }, [open, countdownSeconds]);

  // Heavy haptic the moment the takeover appears.
  useEffect(() => {
    if (open) triggerCriticalHaptic();
  }, [open]);

  // Phase 11 · Native TTS fallback — auto-announce the evacuation copy on
  // open. Walks TTS → pre-recorded clip → vibration so a voice always fires,
  // even on devices without speechSynthesis.
  useEffect(() => {
    if (!open) return;
    void announceAlert({
      text: `Evacuate now. Flood expected in ${formatCountdown(countdownSeconds)}. Move to higher ground immediately.`,
      lang: undefined,
      alertType: "flood",
    });
  }, [open, countdownSeconds]);

  // Never leave speech running once the takeover closes.
  useEffect(() => {
    if (!open) stopSpeaking();
    return () => stopSpeaking();
  }, [open]);

  // Tick the countdown while open.
  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [open]);

  // Focus into the panel on open, restore focus on close.
  useEffect(() => {
    if (open) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [open]);

  // Lock background scroll while the takeover is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc dismisses (the takeover must not trap a demo device).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col bg-severity-red-600"
            role="dialog"
            aria-modal="true"
            aria-labelledby="critical-overlay-headline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Ambient red glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(255,255,255,0.18),transparent),radial-gradient(ellipse_60%_45%_at_50%_115%,rgba(0,0,0,0.35),transparent)]"
            />

            {/* Top row — dismiss */}
            <div className="relative z-10 flex items-center justify-between p-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-widest text-white/90">
                <span className="h-2 w-2 animate-ping rounded-full bg-white" aria-hidden />
                Official Warning
              </span>
              {/* Plain button (not IconButton) — owns its whole look so the
                  ghost variant's colors can't fight the override (gotcha #3). */}
              {/* Read Aloud (Phase 3 · Step 6) — speaks the evacuation
                  instruction aloud; flips to stop while speaking. */}
              {supported && (
                <button
                  type="button"
                  onClick={() =>
                    speaking
                      ? stop()
                      : speak(
                          `Evacuate now. Flood expected in ${formatCountdown(
                            remaining,
                          )}. Move to higher ground immediately.`,
                        )
                  }
                  aria-label={speaking ? "Stop reading aloud" : "Read alert aloud"}
                  aria-pressed={speaking}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-black/20 text-white transition hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {speaking ? (
                    <Square aria-hidden="true" className="h-4 w-4 fill-current" />
                  ) : (
                    <Volume2 aria-hidden="true" className="h-5 w-5" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss alert"
                title="Dismiss alert"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-black/20 text-white transition hover:bg-black/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Center — pulsing headline + countdown */}
            <div
              ref={panelRef}
              tabIndex={-1}
              className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center outline-none"
            >
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">
                Flood imminent in your area
              </p>
              <h1
                id="critical-overlay-headline"
                className="animate-alert-pulse mt-3 text-5xl font-black uppercase leading-none tracking-tight text-white sm:text-6xl"
              >
                Evacuate Now
              </h1>

              {/* Mock countdown */}
              <div className="mt-8 w-full max-w-xs rounded-2xl border border-white/30 bg-black/25 p-4 backdrop-blur">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-white/75">
                  Flood expected in
                </p>
                <p
                  className="mt-1 font-mono text-4xl font-bold tabular-nums text-white"
                  role="timer"
                  aria-label={`${formatCountdown(remaining)} until flooding`}
                >
                  {formatCountdown(remaining)}
                </p>
                <p className="mt-1 text-[0.6875rem] text-white/70">
                  Move to the nearest shelter before this timer ends
                </p>
              </div>
            </div>

            {/* Bottom CTAs — massive, one per action */}
            <div className="relative z-10 space-y-3 p-5 pb-[calc(20px+env(safe-area-inset-bottom))]">
              <Link
                href="/public/map"
                onClick={onAction}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-5 text-lg font-black uppercase tracking-wide text-severity-red-600 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition hover:bg-white/90 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <MapPin className="h-6 w-6" aria-hidden />
                Show Me Where to Go
              </Link>
              <Link
                href="/public/report"
                onClick={onAction}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-black/40 px-6 py-4 text-base font-bold uppercase tracking-wide text-white transition hover:bg-black/55 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <PhoneCall className="h-5 w-5" aria-hidden />
                I Need Help / SOS
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default CriticalAlertOverlay;
