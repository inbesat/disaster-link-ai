"use client";

// ---------------------------------------------------------------------
// components/ui/PullToRefresh.tsx
// UI/UX Phase 3 · Step 9 (+ Phase 8 · Step 8 — spring physics upgrade).
//
// Field users instinctively drag a list down to grab fresh data. This
// wrapper turns the classic mobile gesture into an iOS-style pull-to-
// refresh built on Framer Motion:
//
//   • `useDragControls` — the drag gesture is bound to an internal motion
//     div with `dragListener: false`; page phosphors the finger start and
//     hands the event over to the controls (only notices near the top).
//   • `useMotionValue` — `pullY` tracks the drag target the whole time.
//   • `useTransform` — `spinnerScale` eases the spinner as the pull grows.
//   • dragConstraints stop the page at the `threshold`, and `dragElastic`
//     (0.35) rubber-bands the extra pull — the further away the more it
//     resists, then `dragSnapTo` springs it home with a tuned spring.
//   • A Rotating Shield spinner is revealed behind the content.
//   • Releasing beyond the threshold runs `onRefresh`; success fires an
//     "Updated just now" toast via the global `showToast`.
//
// Wrap a page's content at its root:
//   <PullToRefresh onRefresh={() => router.refresh()}>…page…</PullToRefresh>
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Shield } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

const DEFAULT_THRESHOLD = 80;
const MIN_REFRESH_MS = 1100;

type PullToRefreshProps = {
  /** Fired once the pull passes the threshold and the finger lifts. */
  onRefresh: () => void | Promise<void>;
  /** Drag distance (px) that arms the refresh. Defaults to 80. */
  threshold?: number;
  /** Disables the gesture (e.g. while already refreshing upstream). */
  disabled?: boolean;
  /** Applied to the wrapper element. */
  className?: string;
  children: ReactNode;
};

export function PullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
  className = "",
  children,
}: PullToRefreshProps) {
  const dragControls = useDragControls();
  // The element's translate-y — binds to the drag and springs home on release.
  const pullY = useMotionValue(0);
  const [refreshing, setRefreshing] = useState(false);
  const [visible, setVisible] = useState(false);
  const startYRef = useRef<number | null>(null);

  // Rubber-band feel: scale the spinner up a touch as the pull builds.
  const spinnerScale = useTransform(pullY, [0, threshold * 1.4], [0.8, 1]);

  // While dragging, block the browser's native scroll/overscroll from
  // fighting the gesture (non-passive touchmove on the document).
  useEffect(() => {
    if (refreshing || !visible) return;
    const prevent = (event: TouchEvent) => {
      if (startYRef.current !== null) event.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, [visible, refreshing]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (disabled || refreshing) return;
    if (typeof window !== "undefined" && window.scrollY > 0) return;
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    startYRef.current = event.clientY;
    setVisible(true);
    // Hand the capture of this pointer over to Framer Motion.
    dragControls.start(event);
  };

  const handleDragEnd = (_: unknown, info: { offset: { y: number } }) => {
    startYRef.current = null;
    if (info.offset.y > threshold && !refreshing) {
      void runRefresh();
    } else {
      // Spring sync back to 0 happens via dragSnapToOrigin below.
      setVisible(false);
    }
  };

  const runRefresh = async () => {
    setRefreshing(true);
    const startedAt = Date.now();
    try {
      await onRefresh();
      showToast("success", {
        title: "Updated just now",
        description: "Live data is up to date.",
        duration: 3000,
      });
    } catch {
      // Errors surface in the page — the gesture still completes.
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, MIN_REFRESH_MS - elapsed);
      window.setTimeout(() => {
        setRefreshing(false);
        setVisible(false);
      }, remaining);
    }
  };

  const label = refreshing ? "Refreshing…" : "Release to refresh";

  return (
    <div className={`overflow-x-clip overscroll-y-contain ${className}`}>
      {/* The spinner surface sits behind the draggable content. */}
      <AnimatePresence>
        {visible && (
          <motion.div
            aria-live="polite"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
          >
            <motion.div
              style={{ scale: spinnerScale }}
              className="mt-2 flex items-center gap-2 rounded-full border border-[#2c3f6d] bg-surface px-3.5 py-1.5 shadow-lg"
            >
              <motion.span
                className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/15"
                animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  refreshing
                    ? { duration: 0.6, ease: "linear", repeat: Infinity }
                    : { duration: 0.2 }
                }
              >
                <Shield
                  className="h-3.5 w-3.5 text-cyan-300"
                  strokeWidth={2}
                  aria-hidden
                />
              </motion.span>
              <span className="text-xs font-semibold text-slate-200">{label}</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The page content rides on the motion value, dragged down at the top. */}
      <motion.div
        style={{ y: pullY, touchAction: "pan-y" }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: threshold }}
        dragElastic={{ top: 0, bottom: 0.35 }}
        dragMomentum={false}
        dragSnapToOrigin
        dragTransition={{ power: 0.08, timeConstant: 160 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        onPointerDown={handlePointerDown}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default PullToRefresh;
