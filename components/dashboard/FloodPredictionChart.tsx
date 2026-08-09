"use client";

// ---------------------------------------------------------------------
// components/dashboard/FloodPredictionChart.tsx — UI/UX Phase 4 · Step 8.
//
// Wide horizontal widget (8 of 12 columns) plotting a mock 72-hour river
// level forecast with Recharts. The level climbs through a red dashed
// "Critical Danger Mark" reference line. Chart colours are hard-coded to
// the roadmap tokens (--border-subtle #1e293b, muted text #94a3b8) because
// SVG presentation attributes can't read CSS custom properties.
// ---------------------------------------------------------------------

import Panel from "@/components/ui/Panel";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Chroma/danger reference — above this value the river is at CRITICAL. */
const CRITICAL_LEVEL = 3.4;

const GID = "flood-level-fill";

type ForecastPoint = { time: string; level: number };

function buildForecast(): ForecastPoint[] {
  return Array.from({ length: 73 }, (_, h) => {
    const base = 2.0 + (h / 72) * 2.1; // slow seasonal climb
    const tide = Math.sin(h / 9) * 0.18; // gentle diurnal ripple
    const surge = h > 61 ? (h - 61) * 0.02 : 0; // late-run rapid rise
    return {
      time: `+${h}h`,
      level: Math.round((base + tide + surge) * 100) / 100,
    };
  });
}

export function FloodPredictionChart() {
  const data = buildForecast();

  return (
    <Panel
      className=""
      title="72-Hour River Level Forecast"
      action={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-danger/30 bg-accent-danger/10 px-2.5 py-1 text-[11px] font-semibold text-accent-danger">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-accent-danger"
            aria-hidden
          />
          Critical mark&nbsp;·&nbsp;{CRITICAL_LEVEL} m
        </span>
      }
    >
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={GID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1e293b" strokeDasharray="4 6" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              interval={8}
              tickMargin={8}
            />
            <YAxis
              dataKey="level"
              domain={["dataMin - 0.3", "dataMax + 0.4"]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => `${v.toFixed(1)} m`}
            />

            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #1e293b",
                borderRadius: 8,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
              labelStyle={{ color: "#94a3b8", fontSize: 11 }}
              itemStyle={{ color: "#f1f5f9" }}
              formatter={(value) => [`${Number(value ?? 0).toFixed(2)} m`, "River level"]}
            />

            <ReferenceLine
              y={CRITICAL_LEVEL}
              stroke="#ef4444"
              strokeDasharray="6 6"
              strokeWidth={1.5}
              label={{
                value: "Critical Danger Mark",
                position: "insideTopRight",
                fill: "#ef4444",
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            <Area
              type="monotone"
              dataKey="level"
              stroke="#3b82f6"
              strokeWidth={2}
              fill={`url(#${GID})`}
              dot={false}
              activeDot={{ r: 4, fill: "#3b82f6", stroke: "#0a0f1a", strokeWidth: 2 }}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
}

export default FloodPredictionChart;
