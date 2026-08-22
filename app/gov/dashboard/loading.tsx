import {
  SkeletonLoader,
  SkeletonCard,
  SkeletonRow,
} from "@/components/ui/SkeletonLoader";

// ---------------------------------------------------------------------
// app/gov/dashboard/loading.tsx — UI/UX Phase 16 · Step 2.
//
// Loading skeleton for the government command center dashboard.
// Mirrors the 12-column grid: KPI row → HeroKPI → LiveMap →
// AlertFeed → AI Suggestions → FloodChart → ResourceWidget.
// ---------------------------------------------------------------------

export default function GovDashboardLoading() {
  return (
    <section className="p-4 sm:p-6" aria-busy="true" role="status" aria-label="Loading command center">
      {/* SituationHeader skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonLoader height={20} width={220} />
          <SkeletonLoader height={12} width={160} className="mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonLoader width={100} height={32} borderRadius={8} />
          <SkeletonLoader width={36} height={36} borderRadius={9999} />
        </div>
      </div>

      <div
        className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12"
        role="status"
        aria-label="Loading dashboard widgets"
      >
        {/* HeroKPI row — 4 stat cards */}
        <div className="xl:col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Live Map widget — large 8-col */}
        <div className="md:col-span-2 xl:col-span-8 xl:row-span-2">
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <SkeletonLoader height={14} width={120} />
              <div className="flex gap-2">
                <SkeletonLoader width={60} height={24} borderRadius={9999} />
                <SkeletonLoader width={60} height={24} borderRadius={9999} />
              </div>
            </div>
            <SkeletonLoader className="flex-1 min-h-[200px] rounded-none" />
          </div>
        </div>

        {/* Alert Feed — 5 skeleton rows */}
        <div className="md:col-span-2 xl:col-span-4 xl:row-span-2">
          <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <SkeletonLoader height={14} width={100} />
              <SkeletonLoader width={32} height={22} borderRadius={9999} />
            </div>
            <div className="flex-1 px-3 py-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="flex flex-col gap-3 rounded-lg border border-purple-400/10 bg-purple-400/[0.03] p-5 md:col-span-2 xl:col-span-4">
          <SkeletonLoader height={14} width={140} />
          <SkeletonLoader height={56} width="100%" borderRadius={8} />
          <SkeletonLoader height={40} width="100%" className="mt-auto" />
        </div>

        {/* Flood Chart */}
        <div className="md:col-span-2 xl:col-span-8">
          <div className="rounded-lg border border-white/10 bg-white/5 p-5">
            <SkeletonLoader height={14} width={160} className="mb-4" />
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

        {/* Resource Widget */}
        <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/5 p-5 md:col-span-2 xl:col-span-4">
          <SkeletonLoader height={14} width={130} />
          <SkeletonLoader width={100} height={100} borderRadius={9999} className="mx-auto" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <SkeletonLoader key={i} height={12} width="70%" />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only">Loading command center...</p>
    </section>
  );
}
