import {
  SkeletonLoader,
  SkeletonCard,
  SkeletonRow,
} from "@/components/ui/SkeletonLoader";

// ---------------------------------------------------------------------
// app/public/dashboard/loading.tsx — UI/UX Phase 16 · Step 2.
//
// Loading skeleton for the citizen-facing public dashboard.
// Mirrors the layout: SafetyOverview → FamilyStrip → NearbyShelters →
// EmergencyDial → Module Grid → AI Teaser.
// ---------------------------------------------------------------------

export default function PublicDashboardLoading() {
  return (
    <section className="px-4 py-8 md:px-8" aria-busy="true" role="status" aria-label="Loading dashboard">
      {/* SafetyOverview hero skeleton */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <SkeletonLoader width={48} height={48} borderRadius={12} />
          <div className="flex-1">
            <SkeletonLoader height={14} width={120} />
            <SkeletonLoader height={28} width={200} className="mt-2" />
          </div>
          <SkeletonLoader width={64} height={28} borderRadius={9999} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <SkeletonLoader key={i} height={64} borderRadius={8} />
          ))}
        </div>
      </div>

      {/* EvacuationLifelines skeleton */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <SkeletonLoader width={40} height={40} borderRadius={10} />
            <SkeletonLoader height={14} width="70%" className="mt-3" />
            <SkeletonLoader height={11} width="50%" className="mt-2" />
          </div>
        ))}
      </div>

      {/* FamilyStrip skeleton */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <SkeletonLoader height={14} width={100} />
        <div className="mt-3 flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <SkeletonLoader width={48} height={48} borderRadius={9999} />
              <SkeletonLoader height={10} width={40} />
            </div>
          ))}
        </div>
      </div>

      {/* NearbySheltersList skeleton */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <SkeletonLoader height={14} width={130} />
        <div className="mt-3 space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonRow key={i} trailing={false} />
          ))}
        </div>
      </div>

      {/* EmergencyDial skeleton */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <SkeletonLoader height={14} width={100} />
        <div className="mt-3 grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <SkeletonLoader width={56} height={56} borderRadius={9999} />
              <SkeletonLoader height={10} width={50} />
            </div>
          ))}
        </div>
      </div>

      {/* Module grid skeleton */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <SkeletonLoader width={44} height={44} borderRadius={12} />
              <div className="flex-1">
                <SkeletonLoader height={14} width="80%" />
                <SkeletonLoader height={11} width="60%" className="mt-1.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Teaser skeleton */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
        <SkeletonLoader height={14} width={140} />
        <div className="mt-3 flex gap-2">
          {[0, 1, 2].map((i) => (
            <SkeletonLoader key={i} height={32} width={120} borderRadius={9999} />
          ))}
        </div>
      </div>

      <p className="sr-only">Loading your dashboard...</p>
    </section>
  );
}
