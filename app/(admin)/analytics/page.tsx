"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const RESPONDER_DATA = [
  { time: "Jan", active: 18 },
  { time: "Feb", active: 24 },
  { time: "Mar", active: 22 },
  { time: "Apr", active: 31 },
  { time: "May", active: 47 },
  { time: "Jun", active: 63 },
  { time: "Jul", active: 88 },
  { time: "Aug", active: 104 },
];

const CHANNEL_DATA = [
  { name: "SMS", value: 412 },
  { name: "Push", value: 690 },
  { name: "WhatsApp", value: 305 },
];

const CHANNEL_COLORS = ["#f59e0b", "#38bdf8", "#34d399"];

const TOKEN_DATA = [
  { day: "Mon", tokens: 12400 },
  { day: "Tue", tokens: 9800 },
  { day: "Wed", tokens: 15600 },
  { day: "Thu", tokens: 11200 },
  { day: "Fri", tokens: 20400 },
  { day: "Sat", tokens: 17300 },
  { day: "Sun", tokens: 8900 },
];

const TOOLTIP_STYLE = {
  background: "#0b1120",
  border: "1px solid #2a3a5c",
  borderRadius: 8,
  fontSize: 12,
};

export default function AnalyticsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Platform usage, message delivery, and AI cost trends.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active responders (Area) */}
        <ChartCard title="Active Responders Over Time" subtitle="month on month">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={RESPONDER_DATA} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="activeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#94a3b8" }} />
              <Area
                type="monotone"
                dataKey="active"
                name="Active Responders"
                stroke="#38bdf8"
                strokeWidth={2}
                fill="url(#activeFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Alerts by channel (Pie) */}
        <ChartCard title="Alerts Sent by Channel" subtitle="last 7 days">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={CHANNEL_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                label
              >
                {CHANNEL_DATA.map((_, i) => (
                  <Cell key={i} fill={CHANNEL_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Token usage (Bar) spanning both columns */}
        <div className="lg:col-span-2">
          <ChartCard title="AI Token Usage" subtitle="millions of tokens · weekly report">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOKEN_DATA} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c2740" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#94a3b8" }}
                  formatter={(v) => [`${Number(v).toLocaleString()}`, "tokens"]}
                />
                <Bar dataKey="tokens" name="Tokens used" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-panel-border bg-panel">
      <div className="border-b border-panel-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="h-64 p-4">{children}</div>
    </div>
  );
}