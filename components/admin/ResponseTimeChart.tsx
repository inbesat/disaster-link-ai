"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const DATA = [
  { time: "00:00", ms: 142 },
  { time: "04:00", ms: 128 },
  { time: "08:00", ms: 210 },
  { time: "12:00", ms: 186 },
  { time: "16:00", ms: 164 },
  { time: "20:00", ms: 231 },
  { time: "00:00", ms: 198 },
];

export default function ResponseTimeChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={DATA} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="respFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
        <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="ms" />
        <Tooltip
          contentStyle={{
            background: "#0b1120",
            border: "1px solid #2a3a5c",
            borderRadius: 8,
            fontSize: 12,
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={(v) => [`${v} ms`, "resp time"]}
        />
        <Area
          type="monotone"
          dataKey="ms"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#respFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}