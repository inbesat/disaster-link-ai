"use client";

// ---------------------------------------------------------------------
// components/gov/dashboard/FloodChartWidget.tsx — Phase 7 · Step 3.
//
// 2×1 river-level widget: a 72-hour forecast Area Chart (Recharts) for
// the selected district, with a dashed red "Critical Danger Mark"
// reference line. Chart colours are hard-coded to the roadmap tokens
// (--border-subtle #1e293b, muted text #94a3b8) because SVG presentation
// attributes can't read CSS custom properties — same approach as
// components/dashboard/FloodPredictionChart.tsx.
// ---------------------------------------------------------------------

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

/** Water level (m) above which the district is at CRITICAL risk. */
const CRITICAL_LEVEL = 4.6;

const GID = "gov-flood-fill";

type ForecastPoint = { time: string; level: number };

/** 72 hourly points: slow rise, diurnal ripple, late-run surge over the mark. */
function buildForecast(): ForecastPoint[] {
  return Array.from({ length: 73 }, (_, h) => {
    const base = 3.1 + (h / 72) * 1.4; // seasonal climb toward danger
    const tide = Math.sin(h / 7) * 0.16; // gentle diurnal ripple
    const surge = h > 58 ? (h - 58) * 0.028 : 0; // late-run rapid rise
    return {
      time: `+${h}h`,
      level: Math.round((base + tide + surge) * 100) / 100,
    };
  });
}

export function FloodChartWidget() {
  const data = buildForecast();

  return (
    <section className="flex flex-col rounded-[var(--dl-radius-sm)] border border-white/10 bg-white/[0.04] backdrop-blur transition hover:border-white/20">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="eoc-label text-white">72-Hour River Level Forecast</h2>
          <span className="rounded-full border border-severity-red-400/30 bg-severity-red-400/10 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-severity-red-300">
            GANGA · PATNA
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-severity-red-400/30 bg-severity-red-400/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-severity-red-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-severity-red-400" aria-hidden />
          Critical mark&nbsp;·&nbsp;{CRITICAL_LEVEL} m
        </span>
      </header>

      <div className="h-56 w-full p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id={GID} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
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
              domain={["dataMin - 0.4", "dataMax + 0.6"]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={48}
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
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default FloodChartWidget;
