import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Phase 22 · Step 1 — Command-Center page skeleton.
 *
 * Next.js streams this in place of the page while dashboard routes load.
 * It mirrors the real Command Center chrome (see CommandCenterClient):
 * a KPI header row, a full-bleed map area, a w-80 left sidebar panel of
 * widget blocks, and a bottom time-slider bar.
 */
export default function DashboardLoading() {
  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* KPI header row */}
      <div className="flex items-center gap-4 overflow-hidden px-4 pb-4 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="eoc-panel w-full max-w-[220px] shrink-0 space-y-2.5 p-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Alert banner strip */}
      <div className="mx-4 mb-3">
        <Skeleton className="h-10 w-full rounded-eoc" />
      </div>

      {/* Map area + left sidebar */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map surface */}
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />

        {/* Map top-right controls */}
        <div className="absolute right-4 top-4 space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>

        {/* Left sidebar widget panel */}
        <aside className="absolute left-4 top-4 hidden w-80 flex-col gap-4 rounded-eoc border border-border bg-surface/90 p-5 md:flex">
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-8 w-2/3" />
        </aside>

        {/* Bottom time-slider bar */}
        <div className="absolute bottom-4 left-1/2 w-72 -translate-x-1/2">
          <Skeleton className="h-10 w-full rounded-eoc" />
        </div>
      </div>

      {/* Mobile bottom-sheet handle */}
      <div className="mx-4 mb-3 md:hidden">
        <Skeleton className="h-12 w-full rounded-eoc" />
      </div>

      <p className="sr-only" role="status">
        Loading command center…
      </p>
    </main>
  );
}
