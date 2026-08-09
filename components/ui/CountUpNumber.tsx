"use client";

// ---------------------------------------------------------------------
// components/ui/CountUpNumber.tsx
// UI/UX Phase 10 · Step 1 — animated counting numbers (hero KPIs).
//
// Renders a number that counts up from 0 to `value` over `duration` ms
// (default 1.5s) using a single requestAnimationFrame loop with an
// ease-out curve — the number decelerates into place so the dashboard
// feels alive without feeling frantic. Restarts cleanly whenever the
// target value changes.
//
//   • Formatting — toLocaleString() with Indian grouping by default
//     (47,230), matching StatCard's number rendering.
//   • `from` start — optionally animate between two live values (e.g. the
//     demo simulation's People-at-Risk bumps) instead of always restarting
//     from 0. Defaults to 0, so plain usage is unchanged.
//   • Reduced motion — honors prefers-reduced-motion by snapping straight
//     to the final value (no animation), consistent with the design
//     system's motion-reduce treatment everywhere else.
//   • SSR-safe — the initial state equals `from` on both the server and the
//     client's first paint, so hydration never mismatches; the loop is
//     client-only.
//
// Typically used inside a StatCard `valueNode` so the card's typography
// (text-3xl font-bold tabular-nums) applies to the counting span.
// ---------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

type CountUpNumberProps = {
  /** Target value to count up to. */
  value: number;
  /** Value the count starts from (default 0). Change to animate between
   * two live values instead of always re-counting from zero. */
  from?: number;
  /** Animation length in milliseconds (default 1500). */
  duration?: number;
  /** Locale for comma grouping — defaults to Indian grouping (47,230). */
  locale?: string;
  className?: string;
};

/** Ease-out cubic — fast start, gentle landing. */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function CountUpNumber({
  value,
  from = 0,
  duration = 1500,
  locale = "en-IN",
  className = "",
}: CountUpNumberProps) {
  const [display, setDisplay] = useState(from);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Respect reduced motion — jump straight to the target, no loop.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    // Restart the count from `from` whenever the target, start or duration
    // changes (from === value → no visible change, still settles exactly).
    setDisplay(from);
    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now;
      const progress = Math.min(1, (now - startRef.current) / duration);
      setDisplay(Math.round(from + (value - from) * easeOutCubic(progress)));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, from, duration]);

  return <span className={className}>{display.toLocaleString(locale)}</span>;
}

export default CountUpNumber;
