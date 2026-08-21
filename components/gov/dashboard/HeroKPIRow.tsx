"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  Building2,
  Home,
  Shield,
  Users,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

// ---------------------------------------------------------------------
// components/gov/dashboard/HeroKPIRow.tsx — Phase 8 · Prompt 8.2
//
// Row of 4 StatCards at top of gov dashboard:
//   🌊 Current Risk: 'CRITICAL' in red with pulsing dot + 'Patna District'
//   👥 People at Risk: '47,230' count-up animation + '+12% from yesterday'
//   🏠 Shelters: '18/24' with occupancy progress bar + '4 near capacity'
//   🚁 Resources: '156 units' with breakdown tooltip on hover
//
// Cards: bg-secondary, rounded-xl, padding-20px, hover: lift + shadow.
// Numbers use font-mono for data feel.
// ---------------------------------------------------------------------

/** Count-up hook with IntersectionObserver trigger. */
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    frameId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frameId);
  }, [started, target, duration]);

  return { ref, count };
}

/** Format number with Indian comma grouping. */
function formatNumber(n: number): string {
  return n.toLocaleString("en-IN");
}

type KPICard = {
  icon: React.ElementType;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  subtitle: string;
  trend?: "up" | "down";
  trendValue?: string;
  accentColor: string;
  glowColor: string;
  warning?: string;
};

const KPI_CARDS: KPICard[] = [
  {
    icon: AlertTriangle,
    label: "Current Risk",
    value: 0,
    subtitle: "Patna District",
    accentColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.3)",
    warning: "CRITICAL",
  },
  {
    icon: Users,
    label: "People at Risk",
    value: 47230,
    subtitle: "+12% from yesterday",
    trend: "up",
    trendValue: "+12%",
    accentColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.3)",
  },
  {
    icon: Home,
    label: "Shelters",
    value: 18,
    suffix: "/24",
    subtitle: "4 near capacity",
    accentColor: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.3)",
    warning: "4 near capacity",
  },
  {
    icon: Shield,
    label: "Resources",
    value: 156,
    suffix: " units",
    subtitle: "Boats · Ambulances · Tents",
    accentColor: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.3)",
  },
];

function StatCard({ card, index }: { card: KPICard; index: number }) {
  const { ref, count } = useCountUp(card.value, 2000);
  const Icon = card.icon;

  return (
    <div
      ref={ref}
      className="group relative rounded-xl border border-white/10 bg-[#111827] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${card.accentColor}15` }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: card.accentColor }}
            />
          </span>
          <span className="eoc-label text-slate-400">{card.label}</span>
        </div>
        {card.warning && card.label === "Current Risk" && (
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
            </span>
            <span className="text-xs font-bold text-red-400">{card.warning}</span>
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        {card.prefix && (
          <span className="font-mono text-2xl font-bold text-slate-400">{card.prefix}</span>
        )}
        <span className="font-mono text-3xl font-bold text-white tabular-nums">
          {card.value > 0 ? formatNumber(count) : "CRITICAL"}
        </span>
        {card.suffix && (
          <span className="font-mono text-lg font-bold text-slate-400">{card.suffix}</span>
        )}
      </div>

      {/* Subtitle + trend */}
      <div className="mt-2 flex items-center gap-2">
        {card.trend === "up" && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            {card.trendValue}
          </span>
        )}
        {card.trend === "down" && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-red-400">
            <TrendingDown className="h-3 w-3" />
            {card.trendValue}
          </span>
        )}
        <span className="text-xs text-slate-400">{card.subtitle}</span>
      </div>

      {/* Shelter occupancy bar */}
      {card.label === "Shelters" && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${(count / 24) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Hover glow effect */}
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(200px circle at 50% 0%, ${card.glowColor}, transparent 60%)`,
        }}
      />
    </div>
  );
}

export function HeroKPIRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CARDS.map((card, index) => (
        <StatCard key={card.label} card={card} index={index} />
      ))}
    </div>
  );
}

export default HeroKPIRow;
