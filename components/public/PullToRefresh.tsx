"use client";

// ---------------------------------------------------------------------
// components/public/PullToRefresh.tsx — Phase 2 · Step 10 · Pull-to-
// Refresh for the citizen dashboard.
//
// Citizens obsessively refresh during a storm, so the whole dashboard
// content rides inside this custom PTR block:
//
//   • onTouchStart / onTouchMove / onTouchEnd track a downward drag
//     (only while the page is scrolled to the top) with resistance and a
//     hard cap, so the content visibly follows the finger.
//   • Pulling past 80px arms the refresh ("Release to refresh"); on
//     release a 1.5s mock network request runs with a spinning loader at
//     the top pinned at the threshold.
//   • On completion it fires triggerLightHaptic() (navigator.vibrate(15)
//     — reuse of hooks/useHaptics, the project's guarded wrapper) and
//     stamps a "Last updated: just now" line at the bottom of the page.
//
// Gotcha: React's synthetic touch handlers are attached passively at the
// root, so preventDefault() there cannot suppress the browser's native
// overscroll / pull-to-refresh. A separate non-passive touchmove
// listener on the wrapper element does the suppression, while the React
// handlers own the pull math. The wrapper also carries
// overscroll-y-contain so the browser never hijacks the gesture.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { triggerLightHaptic } from "@/hooks/useHaptics";

const TRIGGER_PX = 80;
const MAX_PULL_PX = 120;
const RESISTANCE = 0.5;
const REFRESH_MS = 1500;

/** "just now" inside the first minute, else a short clock time. */
function relativeLabel(date: Date | null): string {
  if (!date) return "\u2026";
  if (Date.now() - date.getTime() < 60_000) return "just now";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function PullToRefresh({ children }: { children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  // Refs mirror state for the non-passive native listener + touch math.
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);
  const draggingRef = useRef(false);
  const refreshingRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);

  // Stamp "just now" once, after hydration (null on both SSR + first
  // client paint, so the footer never mismatches).
  useEffect(() => {
    setLastUpdatedAt(new Date());
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  // Non-passive listener: suppress native overscroll / browser PTR only
  // while this component is actively dragging or refreshing.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onNativeTouchMove = (e: TouchEvent) => {
      if (draggingRef.current || refreshingRef.current) e.preventDefault();
    };
    el.addEventListener("touchmove", onNativeTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onNativeTouchMove);
  }, []);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (refreshingRef.current || e.touches.length !== 1) return;
    if (window.scrollY > 0) return; // only pull from the top of the page
    startYRef.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (startYRef.current === null || refreshingRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy <= 0) {
      // Finger moved up — not a pull; cancel and let the page scroll.
      startYRef.current = null;
      draggingRef.current = false;
      setDragging(false);
      setPull(0);
      pullRef.current = 0;
      return;
    }
    const next = Math.min(dy * RESISTANCE, MAX_PULL_PX);
    draggingRef.current = true;
    setDragging(true);
    setPull(next);
    pullRef.current = next;
  };

  const onTouchEnd = () => {
    startYRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    if (refreshingRef.current) return;
    if (pullRef.current >= TRIGGER_PX) {
      // Arm the spinner at the threshold and run the mock refresh.
      setRefreshing(true);
      refreshingRef.current = true;
      setPull(TRIGGER_PX);
      pullRef.current = TRIGGER_PX;
      timeoutRef.current = window.setTimeout(() => {
        triggerLightHaptic(); // navigator.vibrate(15) — guarded
        setLastUpdatedAt(new Date());
        setRefreshing(false);
        refreshingRef.current = false;
        setPull(0);
        pullRef.current = 0;
      }, REFRESH_MS);
    } else {
      setPull(0);
      pullRef.current = 0;
    }
  };

  // The browser can fire touchcancel mid-gesture (system gesture, shade
  // pull, scroll-view takeover). Reset everything WITHOUT triggering a
  // refresh — otherwise stale startY/dragging refs keep preventDefault
  // active and can spuriously arm the refresh on the next tap.
  const onTouchCancel = () => {
    startYRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    if (refreshingRef.current) return;
    setPull(0);
    pullRef.current = 0;
  };

  const isPulling = pull > 0;

  return (
    <div
      ref={wrapperRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
      className="relative flex flex-1 flex-col overscroll-y-contain"
    >
      {/* Pull indicator — rides down with the drag, spinner while refreshing */}
      <div
        aria-hidden={!refreshing}
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{
          transform: `translateY(${Math.max(pull - 18, 0)}px)`,
          opacity: isPulling ? 1 : 0,
        }}
      >
        <span className="flex items-center gap-2 rounded-full border border-white/10 bg-[var(--dl-navy-2)] px-3.5 py-1.5 shadow-[var(--dl-shadow-soft)]">
          <Loader2
            className={`h-4 w-4 text-[var(--dl-orange-light)] ${
              refreshing ? "animate-spin" : ""
            }`}
          />
          <span
            className="text-[11px] font-semibold text-white"
            aria-live="polite"
          >
            {refreshing
              ? "Refreshing\u2026"
              : pull >= TRIGGER_PX
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </span>
      </div>

      {/* Content — follows the finger while dragging, eases back on release */}
      <div
        className={`flex flex-1 flex-col motion-reduce:transition-none ${
          dragging ? "" : "transition-transform duration-300 ease-out"
        }`}
        style={{ transform: isPulling ? `translateY(${pull}px)` : undefined }}
      >
        {children}
      </div>

      {/* Last-updated stamp — bottom of the dashboard content */}
      <p className="mt-6 text-center text-[11px] text-[var(--dl-text-muted)]">
        Last updated: {relativeLabel(lastUpdatedAt)}
      </p>
    </div>
  );
}

export default PullToRefresh;
