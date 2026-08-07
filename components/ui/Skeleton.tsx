import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Tailwind classes controlling shape/size (e.g. "h-4 w-full") */
  className?: string;
};

/**
 * Generic pulsing skeleton block (Phase 22 · Step 1).
 *
 * Uses theme-aware tokens: `bg-slate-300/70` in light mode,
 * `bg-slate-800` in dark mode — so the shimmer reads correctly in both
 * Emergency-Ops themes. Pure presentational; hidden from screen readers.
 */
export function Skeleton({ className = "", ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-300/70 dark:bg-slate-800 ${className}`}
      {...rest}
    />
  );
}

/** Convenience row of skeleton lines (avatar + text) used by cards/widgets. */
export function SkeletonLines({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === rows - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export default Skeleton;
