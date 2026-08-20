"use client";

// ---------------------------------------------------------------------
// components/map/MapHeader.tsx — UI/UX Phase 5 · Step 1.
//
// Floating top bar over the full-screen map workspace. Absolutely
// positioned over the map (z-10) with the dark-tinted, blurred slab that
// matches the Command Center look. Contents: back-to-dashboard ghost
// button · district title · pulsing red "Live Status" badge.
// ---------------------------------------------------------------------

import Link from "next/link";
import { ArrowLeft, Maximize, Minimize, Radio } from "lucide-react";

type MapHeaderProps = {
  /** Title shown in the centre, e.g. "Patna Live Operations". */
  title?: string;
  /** Where "Back to Dashboard" navigates. */
  backHref?: string;
  /** Whether presentation / fullscreen mode is currently on. */
  isFullscreen?: boolean;
  /** Toggle presentation mode (header is hidden while active). */
  onToggleFullscreen?: () => void;
};

export function MapHeader({
  title = "Patna Live Operations",
  backHref = "/dashboard",
  isFullscreen = false,
  onToggleFullscreen,
}: MapHeaderProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 bg-[rgb(var(--bg-primary-rgb)/80)] px-3 py-2.5 backdrop-blur-md sm:px-4">
      {/* Back */}
      <Link
        href={backHref}
        className="inline-flex shrink-0 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/10 hover:text-white sm:min-h-[44px]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Back to Dashboard</span>
      </Link>

      {/* District title */}
      <h1 className="min-w-0 truncate text-sm font-semibold tracking-wide text-slate-100 sm:text-base">
        {title}
      </h1>

      {/* Live status badge */}
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent-danger/40 bg-accent-danger/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-danger">
        <Radio className="hidden h-3 w-3 sm:block" aria-hidden />
        <span
          className="h-2 w-2 animate-pulse rounded-full bg-accent-danger"
          aria-hidden
        />
        Live Status
      </span>

      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen (Esc)" : "Enter fullscreen"}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
        >
          {isFullscreen ? (
            <Minimize className="h-4 w-4" aria-hidden />
          ) : (
            <Maximize className="h-4 w-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  );
}

export default MapHeader;
