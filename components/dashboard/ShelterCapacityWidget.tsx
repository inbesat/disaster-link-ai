import { getShelters } from "@/app/actions/shelters";

// Demo fallback so the widget renders even before the DB is reachable.
const MOCK = {
  capacity: 1550,
  occupancy: 812,
};

function barColor(pct: number) {
  if (pct > 80) return "bg-severity-red-500"; // dangerously full
  if (pct <= 50) return "bg-severity-green-500"; // comfortable
  return "bg-severity-amber-500"; // filling up
}

async function loadTotals() {
  try {
    const rows = await getShelters();
    const capacity = rows.reduce((sum, s) => sum + s.capacity, 0);
    const occupancy = rows.reduce((sum, s) => sum + s.currentOccupancy, 0);
    if (capacity <= 0) return MOCK;
    return { capacity, occupancy };
  } catch {
    return MOCK;
  }
}

export default async function ShelterCapacityWidget() {
  const { capacity, occupancy } = await loadTotals();
  const pct = capacity > 0 ? Math.min(100, (occupancy / capacity) * 100) : 0;
  const remaining = Math.max(0, capacity - occupancy);

  const label =
    pct > 80
      ? "CRITICAL — near capacity"
      : pct <= 50
        ? "NOMINAL — ample space"
        : "ELEVATED — filling up";

  const labelColor =
    pct > 80
      ? "text-severity-red-400"
      : pct <= 50
        ? "text-severity-green-400"
        : "text-severity-amber-400";

  return (
    <div className="rounded-eoc border border-border bg-surface p-5">
      <p className="eoc-label text-accent">DISTRICT SHELTER CAPACITY</p>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-sm text-slate-300">
          {occupancy.toLocaleString()} / {capacity.toLocaleString()} occupied
        </span>
        <span className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
          {label}
        </span>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${barColor(pct)} transition-all duration-500`}
          style={{ width: `${Math.max(2, Math.round(pct))}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-slate-400">
        <span className="font-bold tabular-nums text-foreground">
          {remaining.toLocaleString()}
        </span>{" "}
        beds remaining
      </p>
    </div>
  );
}
