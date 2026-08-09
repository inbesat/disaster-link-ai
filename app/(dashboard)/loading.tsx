import {
  SkeletonLoader,
  SkeletonCard,
  SkeletonRow,
} from "@/components/ui/SkeletonLoader";

/**
 * UI/UX Phase 8 · Step 4 — Command-Center loading skeleton.
 *
 * Next.js streams this in place of the page while dashboard routes load.
 * It mirrors the exact 12-column widget grid of `app/(dashboard)/dashboard/
 * page.tsx` (see DashboardGrid): a full-width KPI row, a large 2×2 map
 * square, a 2-row alerts column, then the planner/responders/flood/donut
 * cells. Framer-driven shimmer keeps it smooth; prefers-reduced-motion
 * falls back to static slabs.
 */
export default function DashboardLoading() {
  return (
    <section className="p-4 sm:p-6" aria-busy="true">
      {/* Page title + subtitle */}
      <SkeletonLoader height={24} width={260} />
      <SkeletonLoader height={14} width={340} className="mt-2" />

      <div
        className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-12"
        role="status"
        aria-label="Loading command center"
      >
        {/* KPI row — 4 small StatCard placeholders, full width */}
        <div className="xl:col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Hero map — large 8-col square */}
        <div className="md:col-span-2 xl:col-span-8 xl:row-span-2">
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-subtle bg-secondary">
            <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
              <SkeletonLoader height={14} width={140} />
              <SkeletonLoader width={64} height={22} borderRadius={9999} />
            </div>
            <SkeletonLoader className="flex-1 rounded-none" />
          </div>
        </div>

        {/* Alerts feed — 5 skeleton rows */}
        <div className="md:col-span-2 xl:col-span-4 xl:row-span-2">
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-subtle bg-secondary">
            <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
              <SkeletonLoader height={14} width={110} />
              <SkeletonLoader width={32} height={22} borderRadius={9999} />
            </div>
            <div className="flex-1 divide-y divide-transparent px-3 py-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* AI planner cell */}
        <div className="flex flex-col gap-3 rounded-lg border border-subtle bg-secondary p-5 md:col-span-2 xl:col-span-4">
          <SkeletonLoader height={14} width={150} />
          <SkeletonLoader height={56} width="100%" />
          <SkeletonLoader height={40} width="100%" className="mt-auto" />
        </div>

        {/* Responder status board */}
        <div className="flex flex-col gap-3 rounded-lg border border-subtle bg-secondary p-5 md:col-span-2 xl:col-span-4">
          <SkeletonLoader height={14} width={130} />
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <SkeletonLoader key={i} width={40} height={40} borderRadius={12} />
            ))}
          </div>
        </div>

        {/* 72h forecast — wide 8-col chart */}
        <div className="md:col-span-2 xl:col-span-8">
          <div className="rounded-lg border border-subtle bg-secondary p-5">
            <SkeletonLoader height={14} width={170} className="mb-4" />
            <div className="flex h-40 items-end gap-2">
              {Array.from({ length: 24 }, (_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{ height: `${30 + ((i * 37) % 60)}%` }}
                >
                  <SkeletonLoader height="100%" width="100%" borderRadius={4} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resource readiness donut */}
        <div className="flex flex-col gap-3 rounded-lg border border-subtle bg-secondary p-5 md:col-span-2 xl:col-span-4">
          <SkeletonLoader height={14} width={150} />
          <SkeletonLoader
            width={120}
            height={120}
            borderRadius={9999}
            className="mx-auto"
          />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonLoader key={i} height={12} width="70%" />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only">Loading command center…</p>
    </section>
  );
}
