"use client";

// ---------------------------------------------------------------------
// components/dashboard/ResourceDonutChart.tsx — UI/UX Phase 4 · Step 9.
//
// "Fleet & Resource Readiness" — a Recharts donut (innerRadius 60) showing
// utilisation by category, with a right-hand legend (count + pct). The
// custom sector `shape` honours each sector's `isActive` flag (set by
// Recharts on hover) and pops the wedge out — the v3-compatible way to do
// an "active shape".
// ---------------------------------------------------------------------

import Panel from "@/components/ui/Panel";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  Boats: "#3b82f6", // blue
  Medical: "#ef4444", // red
  "Food & Water": "#22c55e", // green
  Tents: "#f59e0b", // amber
};

type CategorySlice = { name: string; ready: number; total: number };

const DATA: CategorySlice[] = [
  { name: "Boats", ready: 42, total: 52 },
  { name: "Medical", ready: 28, total: 35 },
  { name: "Food & Water", ready: 180, total: 200 },
  { name: "Tents", ready: 64, total: 80 },
];

const SLICES = DATA.map((d) => ({
  name: d.name,
  value: d.ready,
  pct: Math.round((d.ready / d.total) * 100),
  color: CATEGORY_COLORS[d.name] ?? "#94a3b8",
}));

const READY_TOTAL = DATA.reduce((acc, d) => acc + d.ready, 0);
const ALL_TOTAL = DATA.reduce((acc, d) => acc + d.total, 0);
const READY_PCT = Math.round((READY_TOTAL / ALL_TOTAL) * 100);

/**
 * Sector renderer — pops the hovered (isActive) wedge out by adding 6px to
 * the outer radius while leaving the rest of the rings untouched.
 */
function DonutSector(props: {
  isActive?: boolean;
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}) {
  const {
    isActive = false,
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    fill = "#94a3b8",
    stroke,
    strokeWidth,
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + (isActive ? 6 : 0)}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={isActive ? 1 : 0.92}
    />
  );
}

export function ResourceDonutChart() {
  return (
    <Panel
      className=""
      title="Fleet & Resource Readiness"
      action={
        <span className="rounded-full border border-accent-success/30 bg-accent-success/10 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-accent-success">
          {READY_PCT}% ready
        </span>
      }
    >
      <div className="flex items-center gap-2">
        {/* Donut */}
        <div className="relative h-48 w-48 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #1e293b",
                  borderRadius: 8,
                }}
                formatter={(value) => [`${Number(value ?? 0)} units`, "Ready"]}
              />
              <Pie
                data={SLICES}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={84}
                paddingAngle={2}
                stroke="#0a0f1a"
                strokeWidth={2}
                shape={DonutSector}
              >
                {SLICES.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centre readout */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums text-primary">
              {READY_PCT}%
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted">
              operational
            </span>
          </div>
        </div>

        {/* Legend — right side */}
        <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
          {SLICES.map((slice) => (
            <li key={slice.name} className="flex items-center gap-2 rounded-md px-2 py-1">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
                aria-hidden
              />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">
                {slice.name}
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-300">
                {slice.value}
              </span>
              <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted">
                {slice.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}

export default ResourceDonutChart;
