"use client";

// ---------------------------------------------------------------------
// components/gov/dashboard/ShelterStatusWidget.tsx — Phase 7 · Step 5.
//
// 1×1 logistics widget: three district shelters with horizontal occupancy
// progress bars. The bar tracks capacity live — green below 75%, amber
// 75–90%, and RED above 90% so commanders spot a near-full shelter at a
// glance. A red bar also pulses to draw the eye.
// ---------------------------------------------------------------------

type Shelter = {
  id: string;
  name: string;
  occupied: number;
  capacity: number;
};

const SHELTERS: Shelter[] = [
  { id: "s1", name: "Kankarbagh High School", occupied: 452, capacity: 480 },
  { id: "s2", name: "Barh Block Shelter", occupied: 391, capacity: 420 },
  { id: "s3", name: "Mithapur Community Hall", occupied: 214, capacity: 350 },
];

/** 0–74 green · 75–90 amber · >90 red (the critical band). */
function occupancyTone(pct: number): string {
  if (pct > 90) return "bg-severity-red-400";
  if (pct >= 75) return "bg-severity-amber-400";
  return "bg-severity-green-400";
}

export function ShelterStatusWidget() {
  return (
    <section className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="eoc-label text-white">Shelter Status</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white/70">
          {SHELTERS.filter((s) => (s.occupied / s.capacity) * 100 > 90).length} critical
        </span>
      </header>

      <ul className="flex-1 space-y-4 p-5">
        {SHELTERS.map((shelter) => {
          const pct = Math.round((shelter.occupied / shelter.capacity) * 100);
          const tone = occupancyTone(pct);
          const critical = pct > 90;

          return (
            <li key={shelter.id}>
              <div className="mb-1.5 flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] font-medium text-white/90">
                  {shelter.name}
                </p>
                <p className="shrink-0 text-[11px] tabular-nums text-[var(--dl-text-muted)]">
                  <span className={critical ? "font-bold text-severity-red-300" : "text-white/80"}>
                    {shelter.occupied.toLocaleString()}
                  </span>
                  {" / "}
                  {shelter.capacity.toLocaleString()}
                </p>
              </div>

              <div
                className="h-2 w-full overflow-hidden rounded-full bg-black/40"
                role="progressbar"
                aria-valuenow={shelter.occupied}
                aria-valuemin={0}
                aria-valuemax={shelter.capacity}
                aria-valuetext={`${pct}% occupied`}
                aria-label={`${shelter.name} occupancy ${pct}%`}
              >
                <div
                  className={`h-full rounded-full ${tone} transition-[width] duration-500 ${
                    critical ? "animate-pulse" : ""
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="mt-1 text-right text-[10px] tabular-nums text-[var(--dl-text-muted)]">
                {pct}% occupied
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default ShelterStatusWidget;
