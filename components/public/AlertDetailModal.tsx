"use client";

// ---------------------------------------------------------------------
// components/public/AlertDetailModal.tsx — Phase 3 · Step 4 · Alert
// Detail view & action checklist.
//
// Tapping an AlertCard opens this full-screen mobile bottom sheet: the
// official message text, a "Recommended Actions" checklist (per-alert,
// from lib/mock-data/public-alerts.ts), a mock map snippet placeholder,
// and a "Share to WhatsApp" deep link (wa.me — opens the app with the
// message pre-filled).
//
// Conventions match FamilyStrip's dialog: framer-motion spring sheet +
// dark backdrop, Esc / backdrop / X to close, focus moved in on open and
// restored to the trigger on close, MotionConfig reducedMotion="user".
// ---------------------------------------------------------------------

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
} from "framer-motion";
import {
  CheckCircle2,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Square,
  Volume2,
  X,
} from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import { stopSpeaking, useTextToSpeech } from "@/hooks/useTextToSpeech";
import SeverityBadge from "@/components/ui/SeverityBadge";
import { relativeTime, type PublicAlert } from "@/lib/mock-data/public-alerts";

/** WhatsApp share deep link — message pre-filled, no extra setup.
 * (No emoji in the payload — the design-system no-emoji rule applies to
 * UI copy; keeping the shared text clean too.) */
function whatsAppShareUrl(alert: PublicAlert): string {
  const text = `Alert: ${alert.title}\n\n${alert.body}\n\n— via DRIP Citizen Alert`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function AlertDetailModal({
  alert,
  onClose,
}: {
  alert: PublicAlert | null;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const { speak, stop, speaking, supported } = useTextToSpeech();

  // Focus into the sheet on open; restore focus to the trigger on close.
  useEffect(() => {
    if (alert) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      sheetRef.current?.focus();
    } else if (previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus?.();
      previouslyFocusedRef.current = null;
    }
  }, [alert]);

  // Esc closes (window listener so it works regardless of focus).
  useEffect(() => {
    if (!alert) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [alert, onClose]);

  // Never leave speech running for a closed/previous alert.
  useEffect(() => {
    stopSpeaking();
    return () => stopSpeaking();
  }, [alert]);

  // Lock background scroll while the sheet is up (same as the critical
  // overlay — a 92vh sheet must not scroll the page behind it).
  useEffect(() => {
    if (!alert) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [alert]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {alert && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          >
            {/* Bottom sheet — full-width on mobile, framed on desktop */}
            <motion.div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label={`Alert details: ${alert.title}`}
              tabIndex={-1}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[var(--dl-navy-2)] shadow-[var(--dl-shadow-soft)] outline-none sm:rounded-3xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/20 ring-1 ring-[#F97316]/40">
                    <ShieldCheck aria-hidden="true" className="h-5 w-5 text-[#FDBA74]" />
                  </span>
                  <div>
                    <p className="eoc-label text-[var(--dl-text-muted)]">
                      OFFICIAL ADVISORY
                    </p>
                    <h2 className="text-base font-bold leading-snug text-white">
                      {alert.title}
                    </h2>
                  </div>
                </div>
                <IconButton
                  label="Close alert details"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5">
                {/* Severity + time row */}
                <div className="flex items-center gap-2">
                  <SeverityBadge
                    variant={alert.severity}
                    label={
                      alert.severity === "safe"
                        ? "Advisory"
                        : alert.severity === "warning"
                          ? "Warning"
                          : "Critical"
                    }
                    size="sm"
                  />
                  <span className="text-[11px] tabular-nums text-[var(--dl-text-muted)]">
                    {relativeTime(alert.timestamp)}
                  </span>
                </div>

                {/* Official message */}
                <div className="mt-4 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Official message</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--dl-text-on-navy)]">
                    {alert.body}
                  </p>
                </div>

                {/* Recommended actions checklist */}
                <div className="mt-5">
                  <p className="eoc-label text-[var(--dl-text-muted)]">
                    RECOMMENDED ACTIONS
                  </p>
                  <ul className="mt-2 space-y-2">
                    {alert.actions.map((action) => (
                      <li
                        key={action}
                        className="flex items-start gap-2.5 rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/5 p-3 text-sm text-[var(--dl-text-on-navy)]"
                      >
                        <CheckCircle2
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dl-orange-light)]"
                        />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mock map snippet placeholder */}
                <div className="mt-5 overflow-hidden rounded-[var(--dl-radius-sm)] border border-white/10">
                  <div
                    role="img"
                    aria-label="Map snippet placeholder showing your area and nearby shelter"
                    className="relative flex aspect-[16/9] items-center justify-center bg-[var(--dl-navy)]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                      backgroundSize: "28px 28px",
                    }}
                  >
                    <span className="relative flex h-14 w-14 items-center justify-center">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--dl-orange)]/30" />
                      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] shadow-[0_0_20px_rgba(249,115,22,0.6)]">
                        <MapPin aria-hidden="true" className="h-5 w-5 text-white" />
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 px-4 py-2.5">
                    <p className="text-[11px] text-[var(--dl-text-muted)]">
                      Map preview — nearest shelter 1.2 km away
                    </p>
                    <Link
                      href="/public/map"
                      className="text-[11px] font-semibold text-[var(--dl-orange-light)] hover:text-[var(--dl-orange)]"
                    >
                      View full map
                    </Link>
                  </div>
                </div>
              </div>

              {/* Read Aloud floating button (Phase 3 · Step 6) — speaks the
                  alert for visually impaired users or anyone who can't read
                  mid-panic; flips to a stop control while speaking. */}
              {supported && (
                <button
                  type="button"
                  onClick={() =>
                    speaking ? stop() : speak(`${alert.title}. ${alert.body}`)
                  }
                  aria-label={speaking ? "Stop reading aloud" : "Read alert aloud"}
                  aria-pressed={speaking}
                  className="absolute bottom-24 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#F97316] text-white shadow-[0_4px_20px_rgba(249,115,22,0.5)] transition hover:bg-[#EA5B0C] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
                >
                  {speaking ? (
                    <Square aria-hidden="true" className="h-4 w-4 fill-current" />
                  ) : (
                    <Volume2 aria-hidden="true" className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Footer — share */}
              <div className="border-t border-white/10 p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
                <a
                  href={whatsAppShareUrl(alert)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-[var(--dl-radius-sm)] border border-[#25D366]/50 bg-[#25D366]/15 px-4 py-3.5 text-sm font-bold text-[#4EE08B] transition hover:bg-[#25D366]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
                >
                  <MessageCircle aria-hidden="true" className="h-5 w-5" />
                  Share to WhatsApp
                </a>
                <p className="mt-2 text-center text-[11px] text-[var(--dl-text-muted)]">
                  Opens WhatsApp with this alert pre-filled
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}

export default AlertDetailModal;
