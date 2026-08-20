"use client";

import React from "react";
import { motion } from "framer-motion";

const CARDS = [
  {
    emoji: "🚨",
    title: "Active Incidents",
    value: "8",
    badge: "warn",
    badgeText: "⚠ Warning",
    desc: "Multi-state flood and cyclone events requiring coordinated response",
  },
  {
    emoji: "🏥",
    title: "Nearby Hospitals",
    value: "142",
    badge: "live",
    badgeText: "● Online",
    desc: "Hospitals reporting real-time bed capacity and emergency readiness",
  },
  {
    emoji: "🚑",
    title: "Rescue Team Locations",
    value: "286",
    badge: "live",
    badgeText: "● Deployed",
    desc: "GPS-tracked rescue teams across affected districts",
  },
  {
    emoji: "🏠",
    title: "Safe Shelters",
    value: "974",
    badge: "live",
    badgeText: "● Open",
    desc: "Shelters with real-time occupancy and accessibility data",
  },
  {
    emoji: "🌧",
    title: "Weather Radar",
    value: "Live",
    badge: "live",
    badgeText: "● Live",
    desc: "Real-time doppler radar feeds from IMD weather stations",
  },
  {
    emoji: "📞",
    title: "Emergency Hotline",
    value: "100%",
    badge: "live",
    badgeText: "● Up",
    desc: "1070 helpline and district control rooms fully operational",
  },
];

export default function ECCGrid() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--navy-2)] to-[var(--navy-3)] flex items-center justify-center text-lg shadow-md border border-white/10">
          🖥
        </div>
        <div>
          <h3 className="text-white font-bold text-base">Emergency Command Center</h3>
          <p className="text-[11px] text-white/40">
            Unified situational awareness · All systems operational
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card, i) => (
          <motion.div
            key={card.title}
            className="bg-white/[0.04] border border-white/[0.08] rounded-[var(--radius-xl5)] p-5 hover:bg-white/[0.07] transition-all duration-200 group"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.4,
              delay: i * 0.07,
              ease: [0.2, 0.7, 0.2, 1],
            }}
          >
            {/* Top row: icon + badge */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.emoji}</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  card.badge === "warn"
                    ? "bg-amber-500/15 text-amber-400"
                    : "bg-emerald-500/15 text-emerald-400"
                }`}
              >
                {card.badge === "live" && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse align-middle" />
                )}
                {card.badgeText}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-white font-semibold text-sm mb-1">{card.title}</h4>

            {/* Value */}
            <div className="text-2xl font-bold text-white tabular-nums mb-2 group-hover:text-[var(--blue-light)] transition-colors">
              {card.value}
            </div>

            {/* Description */}
            <p className="text-[12px] text-white/40 leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
