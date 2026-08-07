type District = {
  name: string;
  state: string;
  risk: string;
  riskColor: string;
  riskText: string;
  shelterOccupancy: number;
  shelterCapacity: string;
  resourcesDeployed: number;
  unmetDemand: number;
  criticalPriority: boolean;
};

const DISTRICTS: District[] = [
  {
    name: "Patna",
    state: "Bihar",
    risk: "WARNING",
    riskColor: "border-severity-red-500 bg-severity-red-600/15",
    riskText: "text-severity-red-400",
    shelterOccupancy: 94,
    shelterCapacity: "1,263 / 1,340",
    resourcesDeployed: 410,
    unmetDemand: 60,
    criticalPriority: true,
  },
  {
    name: "Kochi",
    state: "Kerala",
    risk: "WATCH",
    riskColor: "border-severity-amber-500 bg-severity-amber-600/15",
    riskText: "text-severity-amber-400",
    shelterOccupancy: 62,
    shelterCapacity: "486 / 780",
    resourcesDeployed: 196,
    unmetDemand: 12,
    criticalPriority: false,
  },
];

function occupancyColor(pct: number): string {
  if (pct >= 85) return "bg-severity-red-500";
  if (pct >= 60) return "bg-severity-amber-500";
  return "bg-severity-green-500";
}

export default function ComparePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <p className="eoc-label text-accent">SUPER ADMIN · TRIAGE</p>
        <h1 className="text-2xl font-bold">Compare Districts</h1>
        <p className="mt-1 text-sm text-slate-400">
          Side-by-side risk posture to decide where resources go first.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {DISTRICTS.map((d) => (
          <section
            key={d.name}
            className={`relative flex flex-col rounded-eoc border bg-surface p-6 ${
              d.criticalPriority
                ? "border-severity-red-500 shadow-glow-red"
                : "border-border"
            }`}
          >
            {d.criticalPriority && (
              <span className="absolute -top-3 left-6 rounded-full border-2 border-severity-red-500 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-widest text-severity-red-400">
                🚨 Critical Priority
              </span>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">{d.name}</h2>
                <p className="text-xs text-slate-400">{d.state}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wider ${d.riskColor} ${d.riskText}`}
              >
                {d.risk}
              </span>
            </div>

            {/* Risk level */}
            <div className="mt-5">
              <p className="eoc-label">RISK LEVEL</p>
              <p className={`mt-0.5 text-lg font-black ${d.riskText}`}>{d.risk}</p>
            </div>

            {/* Shelter capacity */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Shelter Capacity</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {d.shelterCapacity}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
                <div
                  className={`h-full rounded-full ${occupancyColor(d.shelterOccupancy)}`}
                  style={{ width: `${d.shelterOccupancy}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {d.shelterOccupancy}% occupied
              </p>
            </div>

            {/* Unmet demand + deployed */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-eoc border border-border bg-surface-muted/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Resources Deployed
                </p>
                <p className="mt-0.5 text-2xl font-black tabular-nums text-foreground">
                  {d.resourcesDeployed}
                </p>
              </div>
              <div
                className={`rounded-eoc border p-3 ${
                  d.unmetDemand > 0
                    ? "border-severity-red-500/50 bg-severity-red-600/10"
                    : "border-border bg-surface-muted/40"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Unmet Demand
                </p>
                <p
                  className={`mt-0.5 text-2xl font-black tabular-nums ${
                    d.unmetDemand > 0
                      ? "text-severity-red-400"
                      : "text-severity-green-400"
                  }`}
                >
                  {d.unmetDemand}
                </p>
              </div>
            </div>

            {d.criticalPriority && (
              <p className="mt-4 rounded-lg border border-severity-red-600 bg-severity-red-600/10 px-3 py-2 text-xs font-semibold text-severity-red-300">
                Recommended: dispatch next relief convoy to {d.name} within 6 hours.
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
