"use client";

// ---------------------------------------------------------------------
// components/public/map/ReportIncidentFAB.tsx — Phase 4 · Step 9 · The
// Citizen Reporter FAB.
//
// A floating "+" button stacked just above the "Locate Me" FAB. Tapping
// it pops a mini-menu with the three quick crowd-sourcing options:
//   🌊 Flooding Here · 🚧 Road Blocked · 👥 People Trapped
//
// Picking one shows a brief mock loading spinner, then reports the
// incident to PublicMap (which drops a temporary pin at the citizen's
// location — see ReportPins) and confirms with a toast. The option
// labels map onto the shared GroundReport `report_type` vocabulary
// (flooding / road_blocked / rescue) so the pin colors and the triage
// dashboard agree.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, X } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

/** The three quick-report types the public can file (GroundReport subset). */
export type CitizenReportType = "flooding" | "road_blocked" | "rescue";

const REPORT_OPTIONS: Array<{
  type: CitizenReportType;
  emoji: string;
  label: string;
}> = [
  { type: "flooding", emoji: "🌊", label: "Flooding Here" },
  { type: "road_blocked", emoji: "🚧", label: "Road Blocked" },
  { type: "rescue", emoji: "👥", label: "People Trapped" },
];

/** How long the mock "sending" spinner runs before the pin drops. */
const SUBMIT_MS = 900;

type ReportIncidentFABProps = {
  /** Called once the mock submission finishes — parent drops the pin. */
  onSubmit: (type: CitizenReportType) => void;
};

export default function ReportIncidentFAB({ onSubmit }: ReportIncidentFABProps) {
  const [open, setOpen] = useState(false);
  // Non-null while a report is "sending" (menu locks into a spinner).
  const [submitting, setSubmitting] = useState<CitizenReportType | null>(null);
  const timerRef = useRef<number | null>(null);

  // Escape closes the menu; clear any in-flight mock submission on unmount.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = (type: CitizenReportType) => {
    setOpen(false);
    setSubmitting(type);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setSubmitting(null);
      onSubmit(type);
      showToast("success", {
        title: "Report submitted to Command Center.",
        description: "Thank you — authorities have been notified.",
      });
    }, SUBMIT_MS);
  };

  const busy = submitting !== null;

  return (
    // z-20 so the open menu paints above the family-layer toggle FAB that
    // sits higher up the same right-4 column (both are map overlays).
    <div className="absolute bottom-[calc(152px+env(safe-area-inset-bottom))] right-4 z-20 flex flex-col items-end gap-3">
      {/* Mini-menu / sending card */}
      <AnimatePresence>
        {open && !busy && (
          <motion.div
            aria-label="Report an incident"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1120]/95 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <p className="px-4 pb-1 pt-3 text-[0.625rem] font-bold uppercase tracking-widest text-[var(--dl-text-muted)]">
              Report what you see
            </p>
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => handleSelect(option.type)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/5 active:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--dl-orange)]"
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {option.emoji}
                </span>
                {option.label}
              </button>
            ))}
          </motion.div>
        )}

        {busy && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="flex w-60 items-center gap-3 rounded-2xl border border-white/10 bg-[#0a1120]/95 px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <Loader2 aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin text-[var(--dl-orange)]" />
            <p className="text-sm font-semibold text-white">
              Sending report to Command Center&hellip;
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The FAB itself */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-label={open ? "Close report menu" : "Report an incident"}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--dl-orange)] text-white shadow-[0_8px_24px_rgba(249,115,22,0.45)] transition hover:brightness-110 active:scale-95 disabled:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dl-orange)]"
      >
        {busy ? (
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" strokeWidth={2.5} />
        ) : open ? (
          <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
        ) : (
          <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
        )}
      </button>
    </div>
  );
}
