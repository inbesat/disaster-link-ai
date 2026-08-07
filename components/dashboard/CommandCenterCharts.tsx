"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 8,
};

const AXIS_TICK = { fill: "#94a3b8", fontSize: 10 };

const FLOOD_TREND = [
  { h: 0, level: 2.1 },
  { h: 6, level: 2.6 },
  { h: 12, level: 3.4 },
  { h: 18, level: 4.1 },
  { h: 24, level: 5.2 },
  { h: 30, level: 6.0 },
  { h: 36, level: 6.8 },
  { h: 42, level: 7.5 },
  { h: 48, level: 8.1 },
];

const SHELTER_OCCUPANCY = [
  { name: "Central Hall", cap: 450, occ: 312 },
  { name: "Riverside HS", cap: 380, occ: 378 },
  { name: "Hospital Annex", cap: 300, occ: 194 },
  { name: "Gandhi Maidan", cap: 500, occ: 421 },
  { name: "Sonepur Camp", cap: 420, occ: 240 },
];

const AVAILABILITY = [
  { name: "Available", value: 764, color: "#10b981" },
  { name: "Deployed", value: 320, color: "#f59e0b" },
  { name: "Maintenance", value: 96, color: "#ef4444" },
];

export default function CommandCenterCharts() {
  return (
    <div className="flex flex-col gap-4">
      {/* Flood Risk Trend — line chart */}
      <div className="rounded-eoc border border-border bg-surface p-4">
        <p className="eoc-label text-accent">FLOOD RISK TREND (48H)</p>
        <p className="mt-0.5 text-xs text-slate-400">Projected river water level (m)</p>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={FLOOD_TREND}
              margin={{ top: 5, right: 8, bottom: 0, left: -18 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis dataKey="h" tick={AXIS_TICK} unit="h" />
              <YAxis tick={AXIS_TICK} unit="m" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="level"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shelter occupancy vs capacity — bar chart */}
      <div className="rounded-eoc border border-border bg-surface p-4">
        <p className="eoc-label text-accent">SHELTER OCCUPANCY</p>
        <p className="mt-0.5 text-xs text-slate-400">Occupation vs capacity</p>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={SHELTER_OCCUPANCY}
              margin={{ top: 5, right: 5, bottom: 0, left: -18 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
              <XAxis
                dataKey="name"
                tick={AXIS_TICK}
                tickFormatter={(v: string) => v.split(" ")[0]}
              />
              <YAxis tick={AXIS_TICK} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: "rgba(148,163,184,0.1)" }}
              />
              <Bar dataKey="occ" name="Occupied" fill="#38bdf8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cap" name="Capacity" fill="#475569" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resource availability — donut / pie chart */}
      <div className="rounded-eoc border border-border bg-surface p-4">
        <p className="eoc-label text-accent">RESOURCE AVAILABILITY</p>
        <p className="mt-0.5 text-xs text-slate-400">Available vs deployed</p>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={AVAILABILITY}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
              >
                {AVAILABILITY.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
