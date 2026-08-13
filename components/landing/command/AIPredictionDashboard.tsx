"use client";

import { motion } from "framer-motion";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useCountUp } from "@/components/landing/hooks/useCountUp";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const RINGS = [
  { label: "Rainfall Risk", value: 72, color: "#2563EB", glow: "rgba(37,99,235,0.25)" },
  {
    label: "Flood Probability",
    value: 84,
    color: "#F97316",
    glow: "rgba(249,115,22,0.25)",
  },
  {
    label: "Cyclone Intensity",
    value: 46,
    color: "#EAB308",
    glow: "rgba(234,179,8,0.25)",
  },
  {
    label: "Heatwave Severity",
    value: 67,
    color: "#EF4444",
    glow: "rgba(239,68,68,0.25)",
  },
];

const CHART_DATA = [
  { day: "Mon", risk: 42 },
  { day: "Tue", risk: 58 },
  { day: "Wed", risk: 71 },
  { day: "Thu", risk: 84 },
  { day: "Fri", risk: 78 },
  { day: "Sat", risk: 65 },
  { day: "Sun", risk: 52 },
];

/* ------------------------------------------------------------------ */
/*  Metric Ring — SVG circular progress with count-up                  */
/* ------------------------------------------------------------------ */
function MetricRing({
  label,
  value,
  color,
  glow,
  delay,
}: {
  label: string;
  value: number;
  color: string;
  glow: string;
  delay: number;
}) {
  // The count-up hook owns the IntersectionObserver: its `ref` is attached
  // to the card below and `isIntersecting` gates both the animated number
  // and the ring fill, so the ring never shows 0% before/without scrolling
  // into view.
  const { ref, count, isIntersecting } = useCountUp(value, 1400);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = isIntersecting
    ? circumference * (1 - value / 100)
    : circumference;

  return (
    <motion.div
      ref={ref}
      className="bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-5 flex flex-col items-center relative group hover:bg-white/[0.07] transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
      style={{
        boxShadow: isIntersecting ? `0 0 30px -10px ${glow}` : "none",
        transition: "box-shadow 1.4s ease",
      }}
    >
      <div className="relative w-[128px] h-[128px] sm:w-[152px] sm:h-[152px] flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          {/* Track ring */}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset,
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${glow})`,
            }}
          />
        </svg>
        <div className="absolute text-2xl sm:text-3xl font-bold text-white tabular-nums">
          {count}%
        </div>
      </div>
      <div className="text-[13px] text-white/50 mt-3 text-center group-hover:text-white/70 transition-colors">
        {label}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status bar cards                                                   */
/* ------------------------------------------------------------------ */
function StatusCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      {/* Earthquake Activity */}
      <motion.div
        className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4 hover:bg-white/[0.07] transition-colors duration-200"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="text-[11px] text-white/40 uppercase tracking-[0.1em] font-medium mb-3">
          Earthquake Activity
        </div>
        <div className="bg-white/[0.08] rounded-full h-2.5 w-full overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] h-full rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "18%" }}
            viewport={{ once: true }}
            transition={{
              duration: 1.2,
              delay: 0.4,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          />
        </div>
        <div className="text-[10px] text-white/30 mt-1.5">18% — Low</div>
      </motion.div>

      {/* Avg Response Time */}
      <motion.div
        className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4 hover:bg-white/[0.07] transition-colors duration-200"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="text-[11px] text-white/40 uppercase tracking-[0.1em] font-medium mb-2">
          Avg Response Time
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-emerald-400">3</span>
          <span className="text-sm font-semibold text-emerald-400/70">Sec</span>
        </div>
      </motion.div>

      {/* Satellite Updates */}
      <motion.div
        className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4 hover:bg-white/[0.07] transition-colors duration-200"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="text-[11px] text-white/40 uppercase tracking-[0.1em] font-medium mb-2">
          Satellite Updates
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-lg font-bold text-white">Live</span>
        </div>
      </motion.div>

      {/* AI Prediction Confidence */}
      <motion.div
        className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4 hover:bg-white/[0.07] transition-colors duration-200"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <div className="text-[11px] text-white/40 uppercase tracking-[0.1em] font-medium mb-2">
          AI Prediction Confidence
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-[#F97316]">96</span>
          <span className="text-sm font-semibold text-[#F97316]/70">%</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flood Risk Trend chart                                             */
/* ------------------------------------------------------------------ */
function FloodRiskChart() {
  return (
    <motion.div
      className="mt-4 bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-6"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-base">📈</span>
          <span className="text-white font-semibold text-sm">
            Flood Risk Trend — 7 Day Forecast
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/40">
          <span className="w-3 h-[2px] rounded-full bg-[#F97316]" />
          Risk Index
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={CHART_DATA}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="floodRiskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                <stop offset="50%" stopColor="#F97316" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 12 }}
              dx={-10}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(11,31,58,0.92)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "#fff",
                fontSize: "13px",
                backdropFilter: "blur(8px)",
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
              }}
              itemStyle={{ color: "#F97316" }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "11px" }}
              cursor={{
                stroke: "rgba(249,115,22,0.3)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="#F97316"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#floodRiskGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#F97316",
                stroke: "rgba(249,115,22,0.3)",
                strokeWidth: 8,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */
export default function AIPredictionDashboard() {
  return (
    <ScrollReveal>
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#5B8DF6] flex items-center justify-center text-lg shadow-md">
            🤖
          </div>
          <div>
            <h3 className="text-white font-bold text-base">AI Prediction Dashboard</h3>
            <p className="text-[11px] text-white/40">
              Real-time risk analysis powered by satellite + sensor fusion
            </p>
          </div>
        </div>

        {/* Ring cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RINGS.map((ring, i) => (
            <MetricRing key={ring.label} {...ring} delay={i * 0.1} />
          ))}
        </div>

        {/* Status cards */}
        <StatusCards />

        {/* Chart */}
        <FloodRiskChart />
      </div>
    </ScrollReveal>
  );
}
