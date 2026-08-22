"use client";

// ---------------------------------------------------------------------
// components/gov/dashboard/FloodChartWidget.tsx — Phase 7 · Step 3.
//
// 2×1 river-level widget: 72-hour forecast Area Chart (Recharts) with
// dashed red "Critical Danger Mark" reference line. Gradient fill,
// interactive tooltip, threshold crossing highlighted in red.
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
const GID_RED = "gov-flood-fill-red";

type ForecastPoint = { time: string; level: number; isCritical: boolean };

/** 73 hourly points: slow rise, diurnal ripple, late-run surge over the mark. */
function buildForecast(): ForecastPoint[] {
  return Array.from({ length: 73 }, (_, h) => {
    const base = 3.1 + (h / 72) * 1.4;
    const tide = Math.sin(h / 7) * 0.16;
    const surge = h > 58 ? (h - 58) * 0.028 : 0;
    const level = Math.round((base + tide + surge) * 100) / 100;
    return {
      time: `+${h}h`,
      level,
      isCritical: level >= CRITICAL_LEVEL,
    };
  });
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  const level = Number(payload[0]?.value ?? 0);
  const isCritical = level >= CRITICAL_LEVEL;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 shadow-xl">
      <p className="text-[0.625rem] font-semibold text-slate-400">{label}</p>
      <p className={`text-sm font-bold ${isCritical ? "text-red-300" : "text-white"}`}>
        {level.toFixed(2)} m
      </p>
      {isCritical && (
        <p className="mt-0.5 text-[0.625rem] font-semibold text-red-400">⚠ Above critical</p>
      )}
    </div>
  );
};

export function FloodChartWidget() {
  const data = buildForecast();

  return (
    <section className="flex flex-col rounded-xl border border-white/10 bg-[#111827] backdrop-blur transition hover:border-white/20">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="eoc-label text-white">72-Hour River Level Forecast</h2>
          <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-[0.625rem] font-semibold tracking-wide text-red-300">
            GANGA · PATNA
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[0.6875rem] font-semibold text-red-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" aria-hidden />
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
              <linearGradient id={GID_RED} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
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

            <Tooltip content={<CustomTooltip />} />

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

            {/* Main blue area — below threshold */}
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
