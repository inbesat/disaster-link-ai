"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const DECISIONS = [
  "Send flood warning to district control room",
  "Notify district administration & SDRF",
  "Deploy 15 rescue teams to flood zone",
  "Open 4 relief camps in nearby blocks",
  "Alert nearby hospitals to prepare capacity",
  "Send SMS alerts to affected citizens",
];

export default function AIDecisionEngine() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[var(--radius-xl6)] p-6 shadow-[0_0_0_1px_rgba(249,115,22,0.25),0_20px_60px_-20px_rgba(249,115,22,0.35)]">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        {/* AI Orb */}
        <motion.div
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--orange)] to-[var(--orange-light)] flex items-center justify-center text-xl flex-shrink-0 shadow-md"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(249,115,22,0.4)",
              "0 0 20px 6px rgba(249,115,22,0.2)",
              "0 0 0 0 rgba(249,115,22,0.4)",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          🤖
        </motion.div>
        <div>
          <h3 className="text-white font-bold text-base">AI Recommendation Engine</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            Flood Alert #FL-2291 · Bihar Region · Level 3
          </p>
        </div>
      </div>

      {/* Decision items — 2-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DECISIONS.map((decision, i) => (
          <motion.div
            key={decision}
            className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-colors duration-200"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.4,
              delay: i * 0.08,
              ease: [0.2, 0.7, 0.2, 1],
            }}
          >
            <motion.div
              className="flex-shrink-0 mt-0.5"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.3,
                delay: 0.2 + i * 0.08,
                type: "spring",
                stiffness: 300,
              }}
            >
              <CheckCircle2 size={18} className="text-emerald-400" strokeWidth={2.5} />
            </motion.div>
            <span className="text-sm text-white/80 leading-snug">{decision}</span>
          </motion.div>
        ))}
      </div>

      {/* Bottom confidence bar */}
      <div className="mt-5 flex items-center gap-3 pt-4 border-t border-white/[0.06]">
        <div className="flex-1 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
            initial={{ width: 0 }}
            whileInView={{ width: "94%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, delay: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </div>
        <span className="text-[11px] text-emerald-400 font-semibold tabular-nums">
          94% confidence
        </span>
      </div>
    </div>
  );
}
