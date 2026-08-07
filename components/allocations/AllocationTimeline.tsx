"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Allocation = {
  resourceId: string;
  resourceName?: string;
  category: string;
  demandId: string;
  disasterEventId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  quantityAllocated: number;
  priorityScore: number;
  estimatedArrival?: string;
  status: string;
};

const HOUR_WINDOW = 48;

const BAND_COLORS = [
  "#38bdf8",
  "#34d399",
  "#f59e0b",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#fb7185",
  "#eab308",
  "#4ade80",
];

export default function AllocationTimeline({ plan }: { plan: Allocation[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    return plan.map((a) => {
      const base = a.category.charAt(0).toUpperCase() + a.category.slice(1);
      counts[base] = (counts[base] ?? 0) + 1;
      const band = counts[base] > 1 ? `${base} #${counts[base]}` : base;
      const eta = a.estimatedArrival ? new Date(a.estimatedArrival).getTime() : null;
      const hours = eta
        ? Math.max(0, Math.min(HOUR_WINDOW, (eta - Date.now()) / 3600000))
        : 0;
      return { band, hours, quantity: a.quantityAllocated, category: base };
    });
  }, [plan]);

  return (
    <div className="rounded-eoc border border-border bg-surface p-4">
      <p className="eoc-label text-accent">DEPLOYMENT TIMELINE · 0–{HOUR_WINDOW} HRS</p>
      <h2 className="mt-1 font-bold">Dispatch Schedule</h2>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.2)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, HOUR_WINDOW]}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              unit="h"
            />
            <YAxis
              type="category"
              dataKey="band"
              width={90}
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
              formatter={(value) => [`${Number(value).toFixed(1)} h`, "ETA"]}
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]} isAnimationActive>
              {data.map((row, i) => (
                <Cell key={i} fill={BAND_COLORS[i % BAND_COLORS.length]} />
              ))}
              <LabelList
                dataKey="quantity"
                position="right"
                fill="#e2e8f0"
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Bar length = estimated time-to-arrival · label = units dispatched
      </p>
    </div>
  );
}
