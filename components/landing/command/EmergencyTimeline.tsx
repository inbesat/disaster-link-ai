"use client";

import React from "react";
import { motion } from "framer-motion";

const STEPS = [
  {
    time: "10:00 AM",
    emoji: "🛰",
    desc: "Satellite detects heavy rainfall pattern over Bihar region",
  },
  {
    time: "10:02 AM",
    emoji: "🤖",
    desc: "AI predicts 84% flood probability — recommends Level 3 alert",
  },
  {
    time: "10:03 AM",
    emoji: "🏛",
    desc: "District authorities notified via secure government dashboard",
  },
  {
    time: "10:04 AM",
    emoji: "📱",
    desc: "12,400 citizens receive multilingual alerts across 9 channels",
  },
  {
    time: "10:06 AM",
    emoji: "🚑",
    desc: "15 rescue teams dispatched to high-risk flood zones",
  },
];

export default function EmergencyTimeline() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[var(--radius-xl6)] p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--orange)] to-[var(--blue)] flex items-center justify-center text-lg shadow-md">
          ⏱
        </div>
        <div>
          <h3 className="text-white font-bold text-base">Emergency Response Timeline</h3>
          <p className="text-[11px] text-white/40">
            Flood Alert #FL-2291 · Automated response
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-8">
        {/* Gradient vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-[var(--blue)] via-[var(--blue-light)] to-[var(--orange)] rounded-full" />

        <div className="flex flex-col gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.time}
              className="relative flex items-start gap-4"
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.5,
                delay: i * 0.12,
                ease: [0.2, 0.7, 0.2, 1],
              }}
            >
              {/* Dot */}
              <motion.div
                className="absolute -left-8 top-0.5 w-6 h-6 rounded-full border-2 border-white/20 bg-[#081428] flex items-center justify-center text-xs z-10"
                whileInView={{
                  borderColor: "rgba(249,115,22,0.6)",
                  boxShadow: "0 0 12px rgba(249,115,22,0.3)",
                }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.4 }}
              >
                {step.emoji}
              </motion.div>

              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-[var(--orange)] tabular-nums">
                  {step.time}
                </span>
                <p className="text-sm text-white/70 leading-relaxed mt-0.5">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom total time badge */}
      <motion.div
        className="mt-6 flex items-center justify-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl py-2.5 px-4"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <span className="text-xs font-semibold text-emerald-400">
          ⚡ Total Response Time: 6 minutes
        </span>
      </motion.div>
    </div>
  );
}
