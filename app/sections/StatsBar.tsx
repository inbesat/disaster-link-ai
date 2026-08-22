"use client";

import React from "react";
import { Globe, Clock, Zap, Radio } from "lucide-react";
import { useCountUp } from "@/components/landing/hooks/useCountUp";

// ---------------------------------------------------------------------
// app/sections/StatsBar.tsx — Phase 2 · Prompt 2.2 — Live Stats Counter
//
// Full-width stats bar with 4 animated count-up numbers:
//   - 700+ Districts Covered
//   - 48hr Prediction Window
//   - <10sec AI Planning
//   - 65% Rural FM Reach
//
// Uses IntersectionObserver (via useCountUp hook) to trigger animation
// when scrolled into view. Numbers count from 0 to final value over 2s
// with easeOutQuart easing.
// ---------------------------------------------------------------------

interface StatItem {
  icon: React.ElementType;
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  accentColor: string;
}

const STATS: StatItem[] = [
  {
    icon: Globe,
    value: 700,
    suffix: "+",
    label: "Districts Covered",
    accentColor: "#3b82f6", // blue
  },
  {
    icon: Clock,
    value: 48,
    suffix: "hr",
    label: "Prediction Window",
    accentColor: "#8b5cf6", // purple
  },
  {
    icon: Zap,
    value: 10,
    suffix: "sec",
    prefix: "<",
    label: "AI Planning",
    accentColor: "#f59e0b", // amber
  },
  {
    icon: Radio,
    value: 65,
    suffix: "%",
    label: "Rural FM Reach",
    accentColor: "#10b981", // emerald
  },
];

function StatCard({ stat }: { stat: StatItem }) {
  const { ref, count } = useCountUp(stat.value, 2000);
  const Icon = stat.icon;

  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center px-6 py-6"
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: `${stat.accentColor}15` }}
      >
        <Icon size={22} style={{ color: stat.accentColor }} />
      </div>
      <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums">
        {stat.prefix ?? ""}
        {count}
        {stat.suffix}
      </span>
      <span className="text-sm text-slate-400 mt-2 uppercase tracking-wider font-medium">
        {stat.label}
      </span>
    </div>
  );
}

export default function StatsBar() {
  return (
    <section
      className="relative w-full border-y border-white/[0.06]"
      id="stats"
      style={{ backgroundColor: "#111827" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.06]">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
