import { Skeleton } from "@/components/ui/SkeletonLoader";

/**
 * Phase 22 · Step 1 (global skeletons) — Admin panel loading state.
 *
 * Mirrors the AdminSidebar chrome (components/admin/AdminSidebar.tsx):
 * a fixed w-64 sidebar with nav items, and a content area with a page
 * header, KPI cards, and body blocks. Next.js streams this in place of
 * the page while admin routes (/dashboard, /users, /districts, /bulk-ops,
 * /analytics, /audit-logs, /health) load.
 */
export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop sidebar skeleton */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </nav>

        <div className="space-y-2 border-t border-border px-5 py-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-36" />
        </div>
      </aside>

      {/* Content area */}
      <main className="lg:pl-[260px]">
        <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
          {/* Page header */}
          <div className="space-y-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-3 w-72" />
          </div>

          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="eoc-panel space-y-2.5 p-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Primary content block */}
          <div className="eoc-panel space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-28 w-full" />
          </div>

          {/* Secondary blocks */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-40 w-full rounded-eoc" />
            <Skeleton className="h-40 w-full rounded-eoc" />
          </div>
        </div>
      </main>

      <p className="sr-only" role="status">
        Loading admin panel…
      </p>
    </div>
  );
}
