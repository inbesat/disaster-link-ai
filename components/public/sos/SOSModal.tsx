"use client";

// ---------------------------------------------------------------------
// components/public/sos/SOSModal.tsx — Phase 5 · Steps 1–3 · the global
// SOS trigger modal.
//
// A large bottom-sheet (Framer Motion) over a deeply darkened
// bg-black/80 backdrop so nothing distracts mid-panic. It can be closed
// by swiping the sheet down (drag="y" with an offset threshold), the X
// button, tapping the backdrop, or pressing Escape. Opened from anywhere
// via useSOS().open() — the BottomNav SOS tab is the primary trigger.
//
// Inside is the 3×2 grid of massive, touch-friendly tiles (min-h 120px):
//   • I Need Rescue / Medical Emergency — red → arm the Step 3 countdown
//     (SOSCountdown replaces the grid; closing mid-count sends nothing)
//   • Need Food/Water   — amber    → mock submission + toast
//   • Share Location    — blue     → native share / clipboard copy
//   • Call Helpline     — gray     → <a href="tel:108">
//   • I Am Safe         — green    → persists the safe status (reuses the
//                                    same localStorage helpers as the
//                                    alerts-page SafeStatusToggle)
//
// When a countdown completes, the SOS is confirmed → activateEmergency()
// (Step 4) puts the whole app into Emergency Mode and closes the modal.
// ---------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  HeartPulse,
  LifeBuoy,
  Loader2,
  MapPin,
  PhoneCall,
  ShieldCheck,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { triggerHeavyHaptic, triggerLightHaptic } from "@/hooks/useHaptics";
import { readCitizenLocation } from "@/hooks/useSafetyStatus";
import { resolveCitizenMapView } from "@/lib/map/citizen-view";
import { writeSafeStatus } from "@/lib/mock-data/public-alerts";
import { useSOS } from "./SOSContext";
import SOSCountdown from "./SOSCountdown";

/** How long the mock "sending" spinner runs before the confirmation toast. */
const SUBMIT_MS = 900;

type SosActionKind =
  | "rescue"
  | "medical"
  | "food"
  | "share"
  | "helpline"
  | "safe";

type SosAction = {
  kind: SosActionKind;
  label: string;
  icon: LucideIcon;
  /** High-contrast tile fill — reds for danger, amber for needs, etc. */
  tile: string;
};

// Tile text colors live per-tile (NOT in the shared string) so `color` is
// never decided by Tailwind's arbitrary-vs-named utility ordering — the
// amber tile needs navy text on amber, everything else white.
const SOS_ACTIONS: SosAction[] = [
  {
    kind: "rescue",
    label: "I Need Rescue",
    icon: LifeBuoy,
    tile: "bg-severity-red-600 hover:bg-severity-red-500 text-white shadow-[0_6px_18px_rgba(239,68,68,0.35)]",
  },
  {
    kind: "medical",
    label: "Medical Emergency",
    icon: HeartPulse,
    tile: "bg-severity-red-500 hover:bg-severity-red-400 text-white shadow-[0_6px_18px_rgba(239,68,68,0.3)]",
  },
  {
    kind: "food",
    label: "Need Food/Water",
    icon: UtensilsCrossed,
    tile: "bg-severity-amber-500 hover:bg-severity-amber-400 text-[var(--dl-navy)] shadow-[0_6px_18px_rgba(245,158,11,0.3)]",
  },
  {
    kind: "share",
    label: "Share Location",
    icon: MapPin,
    tile: "bg-[var(--dl-blue)] hover:brightness-110 text-white shadow-[0_6px_18px_rgba(37,99,235,0.35)]",
  },
  {
    kind: "helpline",
    label: "Call Helpline",
    icon: PhoneCall,
    tile: "bg-slate-600 hover:bg-slate-500 text-white shadow-[0_6px_18px_rgba(0,0,0,0.3)]",
  },
  {
    kind: "safe",
    label: "I Am Safe",
    icon: ShieldCheck,
    tile: "bg-severity-green-500 hover:bg-severity-green-400 text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)]",
  },
];

/** Labels for the Step 3 countdown ("Sending <label> in 3…"). */
const COUNTDOWN_LABELS: Record<"rescue" | "medical", string> = {
  rescue: "Rescue Request",
  medical: "Medical Emergency",
};

export default function SOSModal() {
  const { isOpen, close, activateEmergency, startSharingLocation } = useSOS();
  const [busy, setBusy] = useState<SosActionKind | null>(null);
  // Step 3 — a critical tile is armed and waiting out its countdown.
  const [pendingAction, setPendingAction] = useState<"rescue" | "medical" | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus into the panel on open; restore focus to the trigger on close.
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
      // Lock background scroll while the modal is up.
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Closing mid-submission cancels the pending mock broadcast.
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setBusy(null);
      // Closing mid-countdown cancels it — nothing is sent.
      setPendingAction(null);
      previouslyFocusedRef.current?.focus?.();
      previouslyFocusedRef.current = null;
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape closes regardless of focus.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  // Clear any in-flight mock submission on unmount.
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  /** Mock submission for the amber request tile (food/water). */
  const submitRequest = (kind: SosActionKind, title: string) => {
    if (busy) return;
    setBusy(kind);
    triggerLightHaptic();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setBusy(null);
      showToast("success", { title, description: "Command Center has been notified." });
      triggerLightHaptic();
    }, SUBMIT_MS);
  };

  /** Step 3 — countdown finished: the SOS is really sent → Emergency Mode. */
  const completeCountdown = useCallback(() => {
    setPendingAction(null);
    activateEmergency();
    close();
    triggerHeavyHaptic();
    showToast("success", { title: "SOS sent", description: "Help is on the way." });
  }, [activateEmergency, close]);

  /** Share the citizen's saved location + begin the live sharing session. */
  const shareLocation = async () => {
    const view = resolveCitizenMapView(readCitizenLocation());
    const coords = `${view.center.lat.toFixed(5)}, ${view.center.lng.toFixed(5)}`;
    const text = `I'm safe here during the emergency — ${view.label} (${coords}).`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "My location", text });
        showToast("success", { title: "Location shared", description: view.label });
      } else {
        await navigator.clipboard.writeText(coords);
        showToast("success", {
          title: "Location copied",
          description: `${view.label} — paste it anywhere to share.`,
        });
      }
    } catch {
      // User cancelled the share sheet (or clipboard unavailable) — do nothing.
    }
    // Step 5 — regardless of the share-sheet outcome, start the persistent
    // live-GPS session (LocationTracker bar with its 30-minute countdown).
    startSharingLocation();
  };

  /** "I Am Safe" — persists like the alerts-page toggle. */
  const markSafe = () => {
    if (busy) return;
    setBusy("safe");
    triggerLightHaptic();
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setBusy(null);
      writeSafeStatus();
      showToast("success", {
        title: "Marked Safe",
        description: "Your status has been shared with registered family members.",
      });
      triggerLightHaptic();
    }, SUBMIT_MS);
  };

  const handleAction = (action: SosAction) => {
    switch (action.kind) {
      case "rescue":
      case "medical":
        // Critical actions arm the 3-second countdown (Step 3) instead of
        // sending instantly — prevents accidental deployments.
        setPendingAction(action.kind);
        break;
      case "food":
        submitRequest("food", "Food/water request sent");
        break;
      case "share":
        void shareLocation();
        break;
      case "helpline":
        break; // rendered as a tel: link — nothing to do here
      case "safe":
        markSafe();
        break;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80]">
          {/* Deeply darkened backdrop — focus the user's attention */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            className="absolute inset-0 bg-black/80"
          />

          {/* Bottom sheet — swipe down to close */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Emergency SOS — choose an action"
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) close();
            }}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-white/10 bg-[var(--dl-navy-2)] pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-16px_60px_rgba(0,0,0,0.6)] outline-none"
          >
            {/* Grab handle + swipe hint */}
            <div className="flex flex-col items-center pt-3">
              <span aria-hidden="true" className="h-1.5 w-12 rounded-full bg-white/20" />
              <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--dl-text-muted)]">
                Swipe down to close
              </p>
            </div>

            {/* Header — SOS title + X */}
            <div className="flex items-start justify-between gap-3 px-5 pt-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-severity-red-400">
                  🆘 SOS
                </h2>
                <p className="mt-0.5 text-sm text-[var(--dl-text-muted)]">
                  Emergency help — one tap away
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close SOS menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-severity-red-400"
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            {/* Step 3 — the countdown replaces the grid while a critical
                action is armed; cancelling (or closing) sends nothing. */}
            {pendingAction ? (
              <SOSCountdown
                actionLabel={COUNTDOWN_LABELS[pendingAction]}
                onComplete={completeCountdown}
                onCancel={() => {
                  setPendingAction(null);
                  triggerLightHaptic();
                }}
              />
            ) : (
              <>
                {/* 3×2 emergency action grid */}
                <div className="grid grid-cols-3 gap-3 px-5 pt-4">
              {SOS_ACTIONS.map((action) => {
                const Icon = action.icon;
                const isBusy = busy === action.kind;
                const shared = `group flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl px-2 text-center transition active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-40 ${action.tile}`;
                const content = (
                  <>
                    {isBusy ? (
                      <Loader2 aria-hidden="true" className="h-9 w-9 animate-spin" strokeWidth={2.25} />
                    ) : (
                      <Icon
                        aria-hidden="true"
                        className="h-9 w-9 transition group-hover:scale-110"
                        strokeWidth={2}
                      />
                    )}
                    <span className="text-[13px] font-bold leading-tight">
                      {action.label}
                    </span>
                  </>
                );
                // Call Helpline is a real tel: link (opens the dialer);
                // every other tile is a button with an in-app action.
                return action.kind === "helpline" ? (
                  <a
                    key={action.kind}
                    href="tel:108"
                    aria-label="Call emergency helpline 108"
                    className={shared}
                  >
                    {content}
                  </a>
                ) : (
                  <button
                    key={action.kind}
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={busy !== null && !isBusy}
                    aria-busy={isBusy}
                    className={shared}
                  >
                    {content}
                  </button>
                );
              })}
            </div>

                {/* Reassurance footer */}
                <p className="px-5 pt-4 text-center text-[11px] text-[var(--dl-text-muted)]">
                  Your SOS includes your saved location. Help is on the way.
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
