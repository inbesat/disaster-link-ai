"use client";

// ---------------------------------------------------------------------
// components/map/MapBottomSheet.tsx — UI/UX Phase 9 · Step 2.
//
// iOS-style draggable bottom sheet for mobile map detail. On small screens
// this replaces the clunky left-sidebar detail panel: the tapped
// Shelter/Resource card lives in a sheet the user grabs and flings to one
// of three snap points.
//
//   • PEEK (25%)   — handle + a sliver of content, map stays prominent.
//   • CONTENT (60%) — most of the detail visible, some map still visible.
//   • FULLSCREEN (95%) — the detail is fully readable, near full-screen.
//
// Implementation notes:
//   • The panel is a fixed-height (95vh) section pinned to `bottom-0`; we
//     translate it DOWN (y > 0) to expose the map behind it. Snap positions
//     are computed in absolute px from the live viewport height so
//     `dragConstraints` are exact pixels rather than ambiguous fractions.
//   • The drag is bound to `style={{ y }}` (a motion value); `onDragEnd`
//     reads the final `y.get()` and hands it to Framer's `animate(value,
//     target, spring)` for a physics-perfect settle onto the nearest snap.
//   • Rubber-banding: `dragElastic` lets the sheet overshoot the top
//     (fullscreen) edge a little, then springs home.
//   • The sheet only ever renders below the `md` breakpoint (mirrors
//     `useIsDesktop` in the Sidebar). On desktop it renders nothing so the
//     legacy InfoDrawer sidebar keeps serving those screens.
// -------------------------------------------------------------------------

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

/** Sheet heights as a fraction of the viewport (0.95 … 0.25: full → peek). */
export const SHEET_SNAPS = {
  PEEK: 0.25,
  CONTENT: 0.6,
  FULLSCREEN: 0.95,
} as const;

export type SheetSnap = keyof typeof SHEET_SNAPS;

/** The panel's own height — 95% of the viewport. */
const SHEET_FRACTION = 0.95;

/** Extra distance past PEEK that counts as "closed" (fully off-screen). */
const CLOSED_MARGIN = 0.08;

const spring = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 } as const;
const none = { duration: 0 } as const;

const SNAP_NAMES = Object.keys(SHEET_SNAPS) as SheetSnap[];

type MapBottomSheetProps = {
  /** Detail content (shelter/resource info) rendered inside the sheet. */
  children: ReactNode;
  /** `feature` present → open the sheet; `null` → dismiss it. */
  feature: { id: string } | null;
  /** Snap the sheet springs to on open. Defaults to PEEK. */
  defaultSnap?: SheetSnap;
  /** Fired after the sheet settles at a snap point. */
  onSnapChange?: (snap: SheetSnap) => void;
  /** Fired when the user flings the sheet past PEEK to fully close. */
  onDismiss?: () => void;
};

/**
 * SSR-safe mobile gate. Returns null until mount (so the first paint never
 * flashes <md content) then mirrors the `md` breakpoint like `useIsDesktop`.
 */
function useMobileOnly(): boolean | null {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return isMobile;
}

export function MapBottomSheet({
  children,
  feature,
  defaultSnap = "PEEK",
  onSnapChange,
  onDismiss,
}: MapBottomSheetProps) {
  const isMobile = useMobileOnly();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [vh, setVh] = useState(0);
  const snapRef = useRef<SheetSnap>(defaultSnap);
  // The sheet's translate-y — bound to the drag, animated to snap targets.
  const y = useMotionValue(0);

  // Translate-y for a snap point, in px: shows `snap` fraction of content.
  const snapToPx = (snap: SheetSnap) =>
    window.innerHeight * (SHEET_FRACTION - SHEET_SNAPS[snap]);

  // Fully hidden translate-y (past the PEEK position, off-screen).
  const closedPx = () => snapToPx("PEEK") + window.innerHeight * CLOSED_MARGIN;

  // Settle the sheet on a value (respecting reduced-motion preference).
  const settle = (px: number) => animate(y, px, reduceMotion ? none : spring);

  // Track viewport height while open so the drag constraints stay exact.
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const measure = () => setVh(window.innerHeight);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  // Open/close are driven by the `feature` prop.
  useEffect(() => {
    if (!feature) {
      settle(closedPx());
      const t = window.setTimeout(() => setOpen(false), 420);
      return () => window.clearTimeout(t);
    }
    setOpen(true);
    snapRef.current = defaultSnap;
    settle(snapToPx(defaultSnap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature, defaultSnap, reduceMotion]);

  const nearestSnap = (px: number): SheetSnap => {
    let closest = snapRef.current;
    let minDist = Number.POSITIVE_INFINITY;
    for (const name of SNAP_NAMES) {
      const dist = Math.abs(px - snapToPx(name));
      if (dist < minDist) {
        minDist = dist;
        closest = name;
      }
    }
    return closest;
  };

  const handleDragEnd = () => {
    const current = y.get();
    // Flung past PEEK by a meaningful margin → dismiss the sheet entirely.
    if (current > snapToPx("PEEK") + vh * CLOSED_MARGIN) {
      settle(closedPx());
      setOpen(false);
      onDismiss?.();
      return;
    }
    const next = nearestSnap(current);
    snapRef.current = next;
    settle(snapToPx(next));
    onSnapChange?.(next);
  };

  const isOpen = open && isMobile;
  // Constrain the drag so it can't fly off above 0 (fullscreen) or below the
  // closed position once vh is measured.
  const constraintBottom =
    vh > 0 ? snapToPx("PEEK") + vh * CLOSED_MARGIN : snapToPx("PEEK") + 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dim the map behind the sheet so the detail pops. */}
          <motion.div
            key="sheet-backdrop"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black"
          />

          <motion.section
            key="sheet"
            role="dialog"
            aria-label="Shelter and resource details"
            style={{ y, touchAction: "pan-y", willChange: "transform" }}
            transition={spring}
            drag="y"
            dragConstraints={{ top: 0, bottom: constraintBottom }}
            dragElastic={{ top: 0.12, bottom: 0.04 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[95%] flex-col rounded-t-2xl border-t border-x border-[#2c3f6d] bg-secondary/95 shadow-2xl backdrop-blur-md"
          >
            {/* Drag handle — thick gray pill, top-center. The handle area IS
                the grab surface; `touch-none` keeps the browser's scroll from
                stealing the pan on mobile. */}
            <div
              className="flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-1 active:cursor-grabbing"
              aria-hidden
            >
              <span className="h-1.5 w-12 rounded-full bg-slate-500/70" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-1">
              {children}
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default MapBottomSheet;
