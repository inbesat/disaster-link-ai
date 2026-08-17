type GapRow = {
  category: string;
  required: number;
  supply: number;
};

const GAP_DATA: GapRow[] = [
  { category: "Boats", required: 120, supply: 76 },
  { category: "Med-Kits", required: 500, supply: 312 },
  { category: "Food Rations", required: 1200, supply: 1230 },
  { category: "Water Pallets", required: 900, supply: 610 },
  { category: "Rescue Teams", required: 40, supply: 32 },
  { category: "Generators", required: 60, supply: 74 },
];

export default function GapAnalysisTable() {
  return (
    <div className="rounded-eoc border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="eoc-label text-accent">RESOURCE GAP ANALYSIS</p>
          <h2 className="mt-0.5 text-sm font-bold text-foreground">Demand vs Supply</h2>
        </div>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] tabular-nums text-slate-300">
          {GAP_DATA.filter((r) => r.required - r.supply > 0).length} shortages
        </span>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-surface-muted/60 text-[10px] uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-2.5 font-semibold">Category</th>
            <th className="px-3 py-2.5 text-right font-semibold">Required</th>
            <th className="px-3 py-2.5 text-right font-semibold">Supply</th>
            <th className="px-4 py-2.5 text-right font-semibold">Deficit / Gap</th>
          </tr>
        </thead>
        <tbody>
          {GAP_DATA.map((row) => {
            const deficit = row.required - row.supply;
            const hasGap = deficit > 0;
            return (
              <tr
                key={row.category}
                className={`border-b border-border/60 last:border-0 ${
                  hasGap ? "bg-severity-red-500/5" : ""
                }`}
              >
                <td
                  className={`px-4 py-2.5 font-semibold capitalize ${hasGap ? "text-foreground" : "text-slate-300"}`}
                >
                  {row.category}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                  {row.required.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                  {row.supply.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {hasGap ? (
                    <span className="rounded bg-severity-red-600 font-black tabular-nums text-severity-red-300">
                      {deficit.toLocaleString()}
                    </span>
                  ) : (
                    <span className="font-semibold tabular-nums text-severity-green-400">
                      +{Math.abs(deficit).toLocaleString()}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
