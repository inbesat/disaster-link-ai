"use client";

import React from "react";
import { motion } from "framer-motion";

const NODES = [
  { emoji: "🛰", text: "Satellite Images + IoT Sensors", highlight: false },
  { emoji: "⛅", text: "Weather APIs", highlight: false },
  { emoji: "🤖", text: "AI Prediction Engine", highlight: false },
  { emoji: "📊", text: "Risk Analysis", highlight: false },
  { emoji: "🖥", text: "Government Dashboard", highlight: false },
  { emoji: "✉️", text: "SMS & App Alerts", highlight: false },
  { emoji: "🚓", text: "Police, NDRF, Hospitals & Rescue Teams", highlight: false },
  { emoji: "🧑‍🤝‍🧑", text: "Citizens Receive Safety Instructions", highlight: true },
];

/* Animated flowing dots between nodes */
function FlowArrow({ delay }: { delay: number }) {
  return (
    <div className="relative h-8 flex items-center justify-center">
      {/* Static connector line */}
      <div className="w-[2px] h-full bg-gradient-to-b from-white/10 to-white/5" />
      {/* Flowing dot */}
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-[#5B8DF6] shadow-[0_0_8px_rgba(91,141,246,0.6)]"
        animate={{ y: [-14, 14] }}
        transition={{
          duration: 1,
          delay,
          repeat: Infinity,
          repeatDelay: 0.8,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default function IntelligencePipeline() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#5B8DF6] flex items-center justify-center text-lg shadow-md">
          🔗
        </div>
        <div>
          <h3 className="text-white font-bold text-base">Intelligence Pipeline</h3>
          <p className="text-[11px] text-white/40">
            End-to-end data flow · Fully automated
          </p>
        </div>
      </div>

      {/* Flow diagram */}
      <div className="flex flex-col items-center max-w-[420px] mx-auto w-full flex-1">
        {NODES.map((node, i) => (
          <React.Fragment key={node.text}>
            <motion.div
              className={`w-full rounded-xl border px-4 py-3 flex items-center gap-3 transition-colors duration-200 ${
                node.highlight
                  ? "bg-[#2563EB]/[0.12] border-[#2563EB]/30 shadow-[0_0_20px_-6px_rgba(37,99,235,0.3)]"
                  : "bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]"
              }`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.4,
                delay: i * 0.08,
                ease: [0.2, 0.7, 0.2, 1],
              }}
            >
              <span className="text-lg flex-shrink-0">{node.emoji}</span>
              <span
                className={`text-sm leading-snug ${
                  node.highlight ? "text-white font-semibold" : "text-white/70"
                }`}
              >
                {node.text}
              </span>
              {node.highlight && (
                <motion.span
                  className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#5B8DF6] flex-shrink-0"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  OUTPUT
                </motion.span>
              )}
            </motion.div>

            {/* Arrow between nodes (not after last) */}
            {i < NODES.length - 1 && <FlowArrow delay={i * 0.15} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
