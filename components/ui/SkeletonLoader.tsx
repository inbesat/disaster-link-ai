"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ComponentPropsWithoutRef, CSSProperties } from "react";

// ---------------------------------------------------------------------
// components/ui/SkeletonLoader.tsx
// UI/UX Phase 1 · Step 6 (+ Phase 8 · Step 4) — loading states.
//
// Flexible shimmer block plus drop-in presets that mirror the exact
// silhouettes of StatCard and DataRow, so layouts don't shift when the
// real data lands:
//
//   <SkeletonLoader width={40} height={40} />
//   <SkeletonCard />      → replaces <StatCard label value trend …>
//   <SkeletonRow />       → replaces <DataRow icon title subtitle …>
//
// Phase 8: the pulse is driven by Framer Motion (opacity 0.55 → 1 → 0.55,
// 1.8s, easeInOut) instead of a CSS keyframe animation, so it animates on
// the JS main thread and stays live even when CSS animations are paused.
// The gradient itself still reads the --skeleton-base/--skeleton-shine
// theme variables. `prefers-reduced-motion` renders a static slab. Legacy
// `Skeleton` (animate-pulse) stays for old surfaces.
// ---------------------------------------------------------------------

type Size = number | string;

export type SkeletonLoaderProps = ComponentPropsWithoutRef<typeof motion.div> & {
  /** Width as a px number or CSS string ("100%"). Default: unset — size
   *  with Tailwind classes instead (`h-4 w-full`). When a prop is given
   *  it wins over classes (inline style). */
  width?: Size;
  /** Height as a px number or CSS string. Same rules as `width`. */
  height?: Size;
  /** Corner radius — px number or CSS string. Default: `rounded-md`.
   *  Pass `9999` for a pill shape. */
  borderRadius?: Size;
  className?: string;
};

/** Numbers are treated as px; strings (e.g. "100%") pass through. */
function toCssSize(value: Size | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * Base shimmer block. Hidden from screen readers (the loading content is
 * announced by the surrounding UI). Rounded with `rounded-md` by default;
 * pass `borderRadius` to override (or a Tailwind radius class when no
 * radius prop is set).
 */
export function SkeletonLoader({
  width,
  height,
  borderRadius,
  className = "",
  style,
  ...rest
}: SkeletonLoaderProps) {
  const reduceMotion = useReducedMotion();

  const shimmerStyle = {
    backgroundImage:
      "linear-gradient(to right, var(--skeleton-base, #1e293b) 40%, var(--skeleton-shine, #334155) 50%, var(--skeleton-base, #1e293b) 60%)",
    backgroundSize: "200% 100%",
    width: toCssSize(width),
    height: toCssSize(height),
    borderRadius: toCssSize(borderRadius),
    ...style,
  } as CSSProperties;

  return (
    <motion.div
      aria-hidden="true"
      className={`rounded-md ${className}`}
      style={shimmerStyle}
      animate={
        reduceMotion
          ? undefined
          : {
              opacity: [0.55, 1, 0.55],
            }
      }
      transition={
        reduceMotion
          ? undefined
          : {
              duration: 1.8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }
      }
      {...rest}
    />
  );
}

type SkeletonCardProps = {
  /** Show the leading icon-tile placeholder (mirrors StatCard's `icon`). */
  icon?: boolean;
  /** Show the trend-line placeholder (mirrors StatCard's `trend`). */
  trend?: boolean;
  className?: string;
};

/**
 * StatCard silhouette — same container (`rounded-md border border-subtle
 * bg-secondary p-4`) with shimmer bars for label, value and (optional)
 * trend, so swapping <StatCard /> → <SkeletonCard /> causes zero layout
 * shift while data fetches.
 */
export function SkeletonCard({
  icon = true,
  trend = true,
  className = "",
}: SkeletonCardProps) {
  return (
    <div className={`rounded-md border border-subtle bg-secondary p-4 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <SkeletonLoader height={14} width="45%" />
        {icon && <SkeletonLoader width={32} height={32} />}
      </div>

      <SkeletonLoader height={30} width="55%" className="mt-2" />

      {trend && <SkeletonLoader height={12} width="20%" className="mt-2" />}
    </div>
  );
}

type SkeletonRowProps = {
  /** Show the trailing badge/value placeholder (mirrors DataRow's
   *  `trailingElement`). */
  trailing?: boolean;
  className?: string;
};

/**
 * DataRow silhouette — icon tile + title/subtitle lines + optional
 * trailing badge placeholder, with the same padding/radius as DataRow.
 */
export function SkeletonRow({ trailing = true, className = "" }: SkeletonRowProps) {
  return (
    <div className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${className}`}>
      <SkeletonLoader width={36} height={36} />

      <div className="min-w-0 flex-1">
        <SkeletonLoader height={14} width="55%" />
        <SkeletonLoader height={11} width="35%" className="mt-1.5" />
      </div>

      {trailing && (
        <SkeletonLoader width={64} height={22} borderRadius={9999} className="ml-auto" />
      )}
    </div>
  );
}

export default SkeletonLoader;
