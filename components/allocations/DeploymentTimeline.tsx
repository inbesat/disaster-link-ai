"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type DeploymentStatus = "pending" | "en_route" | "delivered";

export interface DeploymentTask {
  id: string;
  resourceName: string;
  destination: string;
  status: DeploymentStatus;
  startTimeHrs: number; // Offset in hours from now
  durationHrs: number;
  eta: string;
}

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  pending: "#f59e0b", // amber-500
  en_route: "#3b82f6", // blue-500
  delivered: "#22c55e", // green-500
};

const MOCK_DEPLOYMENTS: DeploymentTask[] = [
  {
    id: "1",
    resourceName: "Rescue Boat Alpha",
    destination: "Riverside Village",
    status: "en_route",
    startTimeHrs: 1.0,
    durationHrs: 2.5,
    eta: "14:30",
  },
  {
    id: "2",
    resourceName: "Medical Team 1",
    destination: "Shelter C",
    status: "delivered",
    startTimeHrs: 0,
    durationHrs: 1.5,
    eta: "12:00",
  },
  {
    id: "3",
    resourceName: "Supply Truck (Food)",
    destination: "Downtown Hub",
    status: "pending",
    startTimeHrs: 3.0,
    durationHrs: 1.0,
    eta: "16:00",
  },
  {
    id: "4",
    resourceName: "Ambulance 04",
    destination: "North Sector",
    status: "en_route",
    startTimeHrs: 0.5,
    durationHrs: 1.2,
    eta: "13:15",
  },
  {
    id: "5",
    resourceName: "Heavy Lift Heli",
    destination: "Mountain Pass",
    status: "en_route",
    startTimeHrs: 2.0,
    durationHrs: 3.0,
    eta: "17:00",
  }
];

export default function DeploymentTimeline({ data = MOCK_DEPLOYMENTS }: { data?: DeploymentTask[] }) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      name: d.resourceName,
      timeRange: [d.startTimeHrs, d.startTimeHrs + d.durationHrs],
      destination: d.destination,
      status: d.status,
      eta: d.eta,
    }));
  }, [data]);

  return (
    <div className="rounded-eoc border border-border bg-surface p-4">
      <p className="eoc-label text-accent">RESOURCE DEPLOYMENT TIMELINE</p>
      <h2 className="mt-1 font-bold text-lg text-foreground">Live Deployments</h2>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148,163,184,0.2)"
              horizontal={false}
            />
            <XAxis
              type="number"
              unit="h"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
              }}
              formatter={(value, name) => {
                if (name === "timeRange") {
                  const range = value as [number, number];
                  return [`${range[0].toFixed(1)}h - ${range[1].toFixed(1)}h`, 'Timeline'];
                }
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return `${data.name} → ${data.destination}`;
                }
                return label;
              }}
            />
            <Bar dataKey="timeRange" radius={[4, 4, 4, 4]} isAnimationActive>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex gap-4 justify-center text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-severity-amber-500" /> Pending
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" /> En Route
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[#22c55e]" /> Delivered
        </div>
      </div>
    </div>
  );
}
