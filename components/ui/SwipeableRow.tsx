"use client";

// ---------------------------------------------------------------------
// components/ui/SwipeableRow.tsx — UI/UX Phase 9 · Step 4.
//
// Fast triage for alert / resource-request feeds, Tinder-style. Each row
// can be swiped left or right to commit an instant verdict without ever
// opening the detail view:
//
//   • Drag RIGHT past +100px → a green "Approve" layer (Check icon) is
//     revealed under the row. Release → haptic buzz + onApprove fires and
//     the row springs out of view to the right.
//   • Drag LEFT past −100px → a red "Reject" layer (X icon) is revealed.
//     Release → onReject fires and the row springs out to the left.
//   • Release before the threshold (or drag back) → the row springs home;
//     nothing happens, so the triage action can't be triggered by accident.
//
// Implementation notes:
//   • Two layers: an absolutely-positioned ACTION UNDERLAY whose color
//     flips via a useTransform of the drag x, and a FOREGROUND row that
//     actually drags. Sliding the foreground over the fixed underlay
//     produces the reveal — the icons stay anchored to the outer edges.
//   • `dragDirectionLock` prevents diagonal drags from fighting vertical
//     feed scrolling, and `touch-action: pan-y` keeps the list scrollable.
//   • On commit the row flings to ±(limit + fling) via the shared motion
//     value and is then locked (it can't be dragged again). The parent
//     receives onApprove/onReject and is expected to remove the row from
//     its state (typically inside <AnimatePresence> so the exit animates a
//     layout collapse).
//
// Usage:
//   <AnimatePresence>
//     {rows.map((r) => (
//       <SwipeableRow
//         key={r.id}
//         onApprove={() => remove(r.id, "approve")}
//         onReject={() => remove(r.id, "reject")}
//       >
//         <AlertRow alert={r} />
//       </SwipeableRow>
//     ))}
//   </AnimatePresence>
// -------------------------------------------------------------------------

import { useCallback, useRef, type ReactNode } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Check, X } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";

/** Swipe distance (px) that commits the verdict. */
export const SWIPE_THRESHOLD = 100;

/** Extra travel so the committed row clears off-screen. */
const SWIPE_FLING = 220;

/** Maximum visible slide (px) before rubber-banding kicks in. */
const SWIPE_LIMIT = 140;

const homeSpring = { type: "spring", stiffness: 420, damping: 34 } as const;
const flingSpring = { type: "spring", stiffness: 320, damping: 28 } as const;
const none = { duration: 0 } as const;

/** Which way a row was finally swiped. */
export type SwipeVerdict = "approve" | "reject";

type SwipeableRowProps = {
  /** Row content (alert / request / …). */
  children: ReactNode;
  /** Fired when released past the right threshold. */
  onApprove?: () => void;
  /** Fired when released past the left threshold. */
  onReject?: () => void;
  /** Fired when a drag begins (e.g. pause a parent polling timer). */
  onSwipeStart?: () => void;
  /** Fired when a drag ends without committing a verdict. */
  onSwipeCancel?: () => void;
  /** Accessible label for the green / approve side. */
  approveLabel?: string;
  /** Accessible label for the red / reject side. */
  rejectLabel?: string;
  /** Disables swiping (e.g. while the row is performing the action). */
  disabled?: boolean;
};

export function SwipeableRow({
  children,
  onApprove,
  onReject,
  onSwipeStart,
  onSwipeCancel,
  approveLabel = "Approve",
  rejectLabel = "Reject",
  disabled = false,
}: SwipeableRowProps) {
  const reduceMotion = useReducedMotion();
  const committed = useRef(false);
  // The foreground's live translate-x — bound to the drag.
  const x = useMotionValue(0);

  // Underlay background: green for right (approve), red for left (reject),
  // transparent at rest. Uses raw slots so the color lerps as you drag.
  const background = useTransform(
    x,
    [-SWIPE_LIMIT, -SWIPE_THRESHOLD, -1, 0, 1, SWIPE_THRESHOLD, SWIPE_LIMIT],
    [
      "rgba(220,38,38,0.95)", // far left → full red
      "rgba(220,38,38,0.95)",
      "rgba(220,38,38,0.2)", // start of red tint
      "rgba(15,23,42,0)", // center → transparent
      "rgba(22,163,74,0.2)", // start of green tint
      "rgba(22,163,74,0.95)",
      "rgba(22,163,74,0.95)", // far right → full green
    ],
  );

  // Icon visibility: cross-fade to the leading side as it crosses 100px.
  const approveOpacity = useTransform(x, (v) =>
    v >= SWIPE_THRESHOLD ? 1 : v > 0 ? v / SWIPE_THRESHOLD : 0,
  );
  const rejectOpacity = useTransform(x, (v) =>
    v <= -SWIPE_THRESHOLD ? 1 : v < 0 ? -v / SWIPE_THRESHOLD : 0,
  );
  // Icons nudge toward the drag so they read "active" inside the reveal.
  const approveX = useTransform(x, (v) => Math.max(0, v - 16));
  const rejectX = useTransform(x, (v) => Math.min(0, v + 16));

  // Snap the row off-screen once a verdict is committed, then lock it so
  // no further dragging can happen (the parent removes the row).
  const fling = useCallback(
    (verdict: SwipeVerdict) => {
      committed.current = true;
      const target =
        verdict === "approve" ? SWIPE_LIMIT + SWIPE_FLING : -(SWIPE_LIMIT + SWIPE_FLING);
      void animate(x, target, reduceMotion ? none : flingSpring);
    },
    [x, reduceMotion],
  );

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (disabled || committed.current) return;
    const { offset } = info;

    if (offset.x >= SWIPE_THRESHOLD) {
      triggerLightHaptic(); // navigator.vibrate(15)
      fling("approve");
      onApprove?.();
      return;
    }
    if (offset.x <= -SWIPE_THRESHOLD) {
      triggerLightHaptic(); // navigator.vibrate(15)
      fling("reject");
      onReject?.();
      return;
    }
    // No verdict — spring home (dragSnapToOrigin handles the rest).
    onSwipeCancel?.();
  };

  return (
    <div className="relative w-full overflow-hidden">
      {/* ACTION UNDERLAY — static; the foreground slides across it. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 flex items-center justify-between px-6"
        style={{ backgroundColor: background }}
      >
        {/* Reject (left) — shown when dragging left. */}
        <motion.span
          style={{ opacity: rejectOpacity, x: rejectX }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
        >
          <X className="h-5 w-5 text-white" strokeWidth={2.5} />
        </motion.span>
        <span className="sr-only">{rejectLabel}</span>

        {/* Approve (right) — shown when dragging right. */}
        <motion.span
          style={{ opacity: approveOpacity, x: approveX }}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
        >
          <Check className="h-5 w-5 text-white" strokeWidth={2.5} />
        </motion.span>
        <span className="sr-only">{approveLabel}</span>
      </motion.div>

      {/* FOREGROUND — the draggable row itself. */}
      <motion.div
        style={{ x, touchAction: "pan-y", willChange: "transform" }}
        drag={disabled ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: -SWIPE_LIMIT, right: SWIPE_LIMIT }}
        dragElastic={0.06}
        dragMomentum={false}
        dragSnapToOrigin
        transition={reduceMotion ? none : homeSpring}
        onDragStart={onSwipeStart}
        onDragEnd={handleDragEnd}
        className="relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  );
}

export default SwipeableRow;
