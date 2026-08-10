"use client";

import React from "react";
import { motion } from "framer-motion";
import { useCountUp } from "@/components/landing/hooks/useCountUp";

/* ------------------------------------------------------------------ */
/*  Map marker data                                                    */
/* ------------------------------------------------------------------ */
const MARKERS = [
  {
    emoji: "🔴",
    label: "Flood — Bihar",
    top: "35%",
    left: "65%",
    color: "rgba(239,68,68,0.4)",
    ring: "rgba(239,68,68,0.25)",
  },
  {
    emoji: "🟠",
    label: "Cyclone — Odisha Coast",
    top: "55%",
    left: "62%",
    color: "rgba(249,115,22,0.4)",
    ring: "rgba(249,115,22,0.25)",
  },
  {
    emoji: "🟡",
    label: "Earthquake — Himachal",
    top: "18%",
    left: "38%",
    color: "rgba(250,204,21,0.4)",
    ring: "rgba(250,204,21,0.25)",
  },
  {
    emoji: "🟢",
    label: "Safe Shelter — Nagpur",
    top: "48%",
    left: "48%",
    color: "rgba(16,185,129,0.4)",
    ring: "rgba(16,185,129,0.25)",
  },
  {
    emoji: "🚑",
    label: "Rescue Team — Gujarat",
    top: "45%",
    left: "28%",
    color: "rgba(59,130,246,0.4)",
    ring: "rgba(59,130,246,0.25)",
  },
  {
    emoji: "🏥",
    label: "Relief Camp — Kolkata",
    top: "42%",
    left: "72%",
    color: "rgba(168,85,247,0.4)",
    ring: "rgba(168,85,247,0.25)",
  },
  {
    emoji: "🟠",
    label: "Cyclone Watch — Andhra",
    top: "62%",
    left: "52%",
    color: "rgba(249,115,22,0.4)",
    ring: "rgba(249,115,22,0.25)",
  },
  {
    emoji: "🟢",
    label: "Safe Shelter — Assam",
    top: "30%",
    left: "78%",
    color: "rgba(16,185,129,0.4)",
    ring: "rgba(16,185,129,0.25)",
  },
];

/* ------------------------------------------------------------------ */
/*  Stats data                                                         */
/* ------------------------------------------------------------------ */
const STATS = [
  {
    icon: "🚨",
    label: "Active Disasters",
    value: 8,
    bg: "bg-red-500/15",
    accent: "text-red-400",
  },
  {
    icon: "📣",
    label: "Citizens Alerted",
    value: 124550,
    bg: "bg-blue-500/15",
    accent: "text-blue-400",
  },
  {
    icon: "🚑",
    label: "Rescue Teams Deployed",
    value: 286,
    bg: "bg-emerald-500/15",
    accent: "text-emerald-400",
  },
  {
    icon: "🏠",
    label: "Safe Shelters",
    value: 974,
    bg: "bg-amber-500/15",
    accent: "text-amber-400",
  },
  {
    icon: "🤖",
    label: "AI Alerts Generated Today",
    value: 3482,
    bg: "bg-purple-500/15",
    accent: "text-purple-400",
  },
];

/* ------------------------------------------------------------------ */
/*  Legend dots                                                        */
/* ------------------------------------------------------------------ */
const LEGEND = [
  { color: "bg-red-500", label: "Flood" },
  { color: "bg-orange-400", label: "Cyclone" },
  { color: "bg-yellow-400", label: "Earthquake" },
  { color: "bg-emerald-400", label: "Shelter" },
];

/* ------------------------------------------------------------------ */
/*  StatCard with count-up animation                                   */
/* ------------------------------------------------------------------ */
function StatCard({ stat, delay }: { stat: (typeof STATS)[0]; delay: number }) {
  const { ref, count } = useCountUp(stat.value);

  return (
    <motion.div
      className="bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-4 flex items-center gap-4 hover:bg-white/[0.07] transition-colors duration-200"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${stat.bg}`}
      >
        {stat.icon}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] text-white/50 truncate">{stat.label}</div>
        <div className="text-2xl font-bold text-white tabular-nums" ref={ref}>
          {count.toLocaleString("en-IN")}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Map Marker with pulse ring                                         */
/* ------------------------------------------------------------------ */
function MapMarker({ marker, delay }: { marker: (typeof MARKERS)[0]; delay: number }) {
  return (
    <motion.div
      className="absolute flex flex-col items-center group cursor-default"
      style={{ top: marker.top, left: marker.left }}
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute w-8 h-8 rounded-full z-0"
        style={{ backgroundColor: marker.ring }}
        animate={{
          scale: [0.5, 2.2],
          opacity: [0.8, 0],
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeOut",
        }}
      />
      {/* Static glow */}
      <div
        className="absolute w-5 h-5 rounded-full z-0 blur-sm"
        style={{ backgroundColor: marker.color }}
      />
      {/* Emoji pin */}
      <span className="text-lg relative z-10 drop-shadow-md">{marker.emoji}</span>
      {/* Tooltip */}
      <div className="absolute -top-9 bg-[rgba(11,31,58,0.92)] backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 pointer-events-none border border-white/10 shadow-lg">
        {marker.label}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function LiveMapStats() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      {/* ---- Map Panel ---- */}
      <div className="bg-white/[0.04] border border-white/10 rounded-[20px] p-6 min-h-[520px] shadow-[0_0_0_1px_rgba(37,99,235,0.25),0_20px_60px_-20px_rgba(37,99,235,0.35)]">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🗺️</span>
            <span className="text-white font-semibold text-sm">
              India — Live Alert Map
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {LEGEND.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 text-[11px] text-white/50"
              >
                <span className={`w-2 h-2 rounded-full ${item.color}`} />
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Map area */}
        <div className="relative h-[420px] w-full bg-gradient-to-b from-[#0d2545] to-[#081428] rounded-xl overflow-hidden">
          {/* Grid lines */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* India outline SVG */}
          <svg
            viewBox="0 0 450 420"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="indiaFill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(37,99,235,0.12)" />
                <stop offset="100%" stopColor="rgba(37,99,235,0.04)" />
              </linearGradient>
            </defs>
            <path
              d="M200,50 L230,45 L250,60 L280,55 L300,70 L320,90 L310,120 L330,150 L340,180 L320,220 L310,260 L280,300 L260,330 L240,350 L220,370 L200,380 L180,370 L160,350 L140,300 L130,260 L120,220 L130,180 L140,150 L150,120 L160,90 L170,70 L190,55 Z"
              fill="url(#indiaFill)"
              stroke="rgba(37,99,235,0.3)"
              strokeWidth="1.5"
            />
          </svg>

          {/* Map markers */}
          {MARKERS.map((marker, i) => (
            <MapMarker key={i} marker={marker} delay={0.3 + i * 0.08} />
          ))}

          {/* Bottom-left live indicator */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[10px] text-white/50 font-medium">
              Live · Demo Data
            </span>
          </div>

          {/* Live feed ticker */}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-[rgba(8,20,40,0.8)] border-t border-white/[0.06] flex items-center px-4 gap-3 overflow-hidden">
            <span className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold whitespace-nowrap flex-shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-400" />
              </span>
              LIVE FEED
            </span>
            <div
              className="flex gap-10 text-[10px] text-white/40 whitespace-nowrap"
              style={{
                animation: "marquee 25s linear infinite",
              }}
            >
              <span>[14:02:33] FLASH FLOOD WARNING ISSUED FOR BIHAR REGION.</span>
              <span>[14:00:12] CYCLONE TRACK UPDATED: LANDFALL EXPECTED ODISHA COAST 18:00 IST.</span>
              <span>[13:45:00] 5 NEW SHELTERS OPENED IN ASSAM.</span>
              <span>[13:30:45] MAGNITUDE 4.2 SEISMIC ACTIVITY DETECTED HIMACHAL PRADESH.</span>
              <span>[14:02:33] FLASH FLOOD WARNING ISSUED FOR BIHAR REGION.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Stats Panel ---- */}
      <div className="flex flex-col gap-4">
        {STATS.map((stat, i) => (
          <StatCard key={stat.label} stat={stat} delay={0.1 + i * 0.08} />
        ))}
      </div>
    </div>
  );
}
