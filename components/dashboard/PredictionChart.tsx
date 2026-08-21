"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";

// 7-day mock forecast used only when the database has no real predictions yet
// (e.g. before the ML service has run). Values are water level in metres.
const MOCK_HISTORY = [
  { day: "Mon", predicted: 8.1, actual: 8.0 },
  { day: "Tue", predicted: 8.6, actual: 8.4 },
  { day: "Wed", predicted: 9.2, actual: 9.1 },
  { day: "Thu", predicted: 9.8, actual: 9.7 },
  { day: "Fri", predicted: 10.3, actual: 10.5 },
  { day: "Sat", predicted: 10.9, actual: 10.8 },
  { day: "Sun", predicted: 11.2, actual: 11.4 },
];

const DANGER_LEVEL_M = 10.5;

const ACCENT = "#38bdf8"; // sky accent
const GREEN = "#10b981"; // severity-green-500
const AMBER = "#f59e0b";
const RED = "#ef4444";

type HistoryResponse = {
  source: "real" | "mock";
  points: Array<{ day: string; riskIndex: number; predictions: number }>;
};

// Recharts line for the real "risk index" (0 Safe → 3 Evacuate) series.
function RiskChart({ points }: { points: HistoryResponse["points"] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 6, right: 12, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            domain={[0, 3]}
            ticks={[0, 1, 2, 3]}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              border: "1px solid #b45309",
              borderRadius: "0.625rem",
              fontSize: 12,
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value, name) => [`${name} ${value}`, "Risk index"]}
          />

          <ReferenceLine
            y={2}
            stroke={RED}
            strokeDasharray="4 4"
            label={{
              value: "Warning",
              position: "insideTopRight",
              fill: "#f87171",
              fontSize: 11,
            }}
          />
          <ReferenceLine
            y={1}
            stroke={AMBER}
            strokeDasharray="4 4"
            label={{
              value: "Watch",
              position: "insideTopLeft",
              fill: "#fbbf24",
              fontSize: 11,
            }}
          />

          <Legend wrapperStyle={{ fontSize: 12 }} />

          <Line
            type="monotone"
            dataKey="riskIndex"
            name="Avg Risk Index"
            stroke={ACCENT}
            strokeWidth={2.5}
            dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PredictionChart() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/predictions/history?days=7")
      .then((res) => res.json())
      .then((data: HistoryResponse) => {
        if (active) setHistory(data);
      })
      .catch(() => {
        if (active) setHistory({ source: "mock", points: [] });
      });
    return () => {
      active = false;
    };
  }, []);

  const isReal = history?.source === "real" && (history.points?.length ?? 0) > 0;

  return (
    <div className="eoc-panel p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="eoc-label text-accent">
          {isReal ? "MODEL OUTPUT · FLOOD RISK TREND" : "FLOOD FORECAST TREND"}
        </p>
        {isReal ? (
          <span className="rounded-full border border-severity-green-600 bg-severity-green-600/10 px-2 py-0.5 text-eoc-tiny font-semibold uppercase text-severity-green-400">
            Live
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <span className="rounded-full border border-severity-amber-600 bg-severity-amber-600/10 px-2 py-0.5 text-eoc-tiny font-semibold uppercase text-severity-amber-400">
              Demo Data
            </span>
            <span className="text-eoc-tiny uppercase tracking-wider text-slate-500">
              runs off flood_predictions
            </span>
          </span>
        )}
      </div>

      {isReal ? (
        <RiskChart points={history.points} />
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={MOCK_HISTORY}
              margin={{ top: 6, right: 12, left: -16, bottom: 0 }}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                domain={[7, 12]}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #b45309",
                  borderRadius: "0.625rem",
                  fontSize: 12,
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />

              <ReferenceLine
                y={DANGER_LEVEL_M}
                stroke={RED}
                strokeDasharray="4 4"
                label={{
                  value: "Danger",
                  position: "insideTopRight",
                  fill: "#f87171",
                  fontSize: 11,
                }}
              />

              <Legend wrapperStyle={{ fontSize: 12 }} />

              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke={ACCENT}
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual"
                stroke={GREEN}
                strokeWidth={2.5}
                dot={{ r: 3, fill: GREEN, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-1 text-xs text-slate-500">
        {isReal
          ? "Daily average model risk index — 0 Safe · 1 Watch · 2 Warning · 3 Evacuate"
          : `Danger threshold ≈ ${DANGER_LEVEL_M} m`}
      </p>
    </div>
  );
}
