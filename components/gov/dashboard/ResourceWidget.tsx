"use client";

import { Boxes } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// ---------------------------------------------------------------------
// components/gov/dashboard/ResourceWidget.tsx — Phase 7 · Step 5.
//
// 1×1 logistics widget: a Recharts donut splitting district resources
// between Available and Deployed, with a centre readout of the ready
// percentage. Below it, a low-stock warning strip flags categories
// running out (e.g. "🚤 Boats: Low") in amber/red so commanders can
// reallocate before a gap becomes a failure.
// ---------------------------------------------------------------------

const DONUT_DATA = [
  { name: "Available", value: 412 },
  { name: "Deployed", value: 208 },
];

const AVAILABLE = DONUT_DATA[0].value;
const DEPLOYED = DONUT_DATA[1].value;
const AVAILABLE_PCT = Math.round((AVAILABLE / (AVAILABLE + DEPLOYED)) * 100);

/** Low-stock categories — the warning strip at the bottom. */
const LOW_STOCK: Array<{ icon: string; label: string; level: "low" | "critical" }> = [
  { icon: "🚤", label: "Boats", level: "low" },
  { icon: "🧥", label: "Life jackets", level: "critical" },
];

export function ResourceWidget() {
  return (
    <section className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Boxes aria-hidden="true" className="h-4 w-4 text-[var(--dl-blue-light)]" />
          <h2 className="eoc-label text-white">Resource Inventory</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-severity-amber-400/30 bg-severity-amber-400/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-severity-amber-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-severity-amber-400" aria-hidden />
          2 low-stock
        </span>
      </header>

      <div className="flex flex-1 flex-col items-center gap-1 p-5">
        {/* Donut — available vs deployed */}
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                }}
                itemStyle={{ color: "#f1f5f9" }}
                formatter={(value) => [`${Number(value ?? 0).toLocaleString()} units`, ""]}
              />
              <Pie
                data={DONUT_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                paddingAngle={3}
                stroke="#0a0f1a"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
              >
                <Cell fill="#3b82f6" />
                <Cell fill="#ef4444" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-white">{AVAILABLE_PCT}%</span>
            <span className="text-[0.625rem] uppercase tracking-wider text-[var(--dl-text-muted)]">
              available
            </span>
          </div>
        </div>

        {/* Legend */}
        <ul className="flex w-full max-w-[180px] flex-col gap-1.5 pt-2">
          <li className="flex items-center justify-between text-xs text-[var(--dl-text-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" aria-hidden /> Available
            </span>
            <span className="font-semibold tabular-nums text-white/80">{AVAILABLE.toLocaleString()}</span>
          </li>
          <li className="flex items-center justify-between text-xs text-[var(--dl-text-muted)]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ef4444]" aria-hidden /> Deployed
            </span>
            <span className="font-semibold tabular-nums text-white/80">{DEPLOYED.toLocaleString()}</span>
          </li>
        </ul>

        {/* Low-stock warning strip */}
        <div className="mt-3 w-full space-y-1.5">
          {LOW_STOCK.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg border border-severity-amber-400/25 bg-severity-amber-400/5 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-white/85">
                <span aria-hidden>{item.icon}</span> {item.label}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide ${
                  item.level === "critical"
                    ? "bg-severity-red-400/15 text-severity-red-300"
                    : "bg-severity-amber-400/15 text-severity-amber-300"
                }`}
              >
                {item.level}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ResourceWidget;
