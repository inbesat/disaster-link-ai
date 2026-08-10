"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const TRUST_STATS = [
  { value: "50M+", label: "Citizens Protected" },
  { value: "22", label: "States Connected" },
  { value: "9", label: "Alert Channels" },
  { value: "98.4%", label: "Delivery Success" },
];

const FEED_STATS = [
  { value: "08", label: "Active Alerts" },
  { value: "286", label: "Rescue Teams" },
  { value: "974", label: "Shelters" },
];

const EASE = [0.2, 0.7, 0.2, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = "",
  y = 26,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, #12335e 0%, #0B1F3A 46%, #081527 100%)",
        }}
      />
      {/* Dot-grid overlay, masked with a radial fade */}
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-14 lg:gap-12 items-center py-28 lg:py-20 w-full">
        {/* Left column */}
        <div>
          <Reveal delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F97316]" />
              </span>
              🛰 AI-Powered Disaster Management Platform
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mt-6 font-[family-name:var(--font-display)]">
              Every Second Saves Lives.
              <br />
              <span className="bg-gradient-to-r from-[#5B8DF6] to-[#F97316] bg-clip-text text-transparent">
                No Citizen Left Unwarned.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg text-[#C9D6EC] mt-6 max-w-xl leading-relaxed">
              DisasterLink AI predicts disasters before they strike and delivers critical
              alerts across 9 communication channels — reaching every citizen, even in the
              most remote villages, within seconds.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#platform"
                className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full px-8 py-3.5 font-semibold text-base hover:shadow-[0_20px_60px_-20px_rgba(37,99,235,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Explore Platform →
              </a>
              <a
                href="#contact"
                className="border border-white/20 text-white rounded-full px-8 py-3.5 text-base hover:bg-white/10 hover:border-white/30 transition-all"
              >
                Request Demo
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/10 w-full max-w-xl">
              {TRUST_STATS.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`flex flex-col ${idx > 0 ? "border-l border-white/10 pl-6" : ""}`}
                >
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-[#C9D6EC] uppercase tracking-wider mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right column — dashboard mockup */}
        <Reveal delay={0.35} y={34} className="relative">
          <div className="bg-white/[0.06] border border-white/[0.14] backdrop-blur-[18px] rounded-[22px] p-5 relative z-10 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-white/70">
                  LIVE NATIONAL FEED
                </span>
              </div>
              <span className="text-[10px] text-white/40">Updated 4s ago</span>
            </div>

            {/* Radar map */}
            <div className="h-[200px] relative flex items-center justify-center bg-[rgba(37,99,235,0.05)] rounded-xl overflow-hidden">
              {/* concentric animated rings */}
              <div
                className="absolute w-[70px] h-[70px] rounded-full border border-[#2563EB]/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-mpulse"
                style={{ animationDelay: "0s" }}
              />
              <div
                className="absolute w-[70px] h-[70px] rounded-full border border-[#F97316]/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-mpulse"
                style={{ animationDelay: "1.1s" }}
              />
              <div
                className="absolute w-[70px] h-[70px] rounded-full border border-emerald-400/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 motion-safe:animate-mpulse"
                style={{ animationDelay: "2.2s" }}
              />
              {/* static inner rings */}
              <div className="absolute w-[130px] h-[130px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute w-[64px] h-[64px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              {/* center dot */}
              <div className="absolute w-2 h-2 rounded-full bg-white/60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

              {/* colored pins */}
              <div
                className={`absolute w-3 h-3 bg-[#2563EB] rounded-full top-1/4 left-1/3 ${
                  reduce ? "" : "animate-dotpulse"
                }`}
              />
              <div
                className={`absolute w-3 h-3 bg-[#F97316] rounded-full top-2/3 right-1/4 ${
                  reduce ? "" : "animate-dotpulse"
                }`}
                style={{ animationDelay: "0.6s" }}
              />
              <div
                className={`absolute w-3 h-3 bg-emerald-400 rounded-full bottom-1/4 left-1/2 ${
                  reduce ? "" : "animate-dotpulse"
                }`}
                style={{ animationDelay: "1.2s" }}
              />
            </div>

            {/* Bottom stats grid */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {FEED_STATS.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={reduce ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.85 + idx * 0.1, ease: EASE }}
                  className="bg-white/[0.06] rounded-xl p-3 text-center border border-white/[0.06]"
                >
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Floating chips */}
          <div
            className={`absolute top-4 -right-4 lg:-right-14 bg-white/[0.08] border border-white/[0.15] backdrop-blur-[12px] rounded-xl px-4 py-2.5 text-sm text-white z-20 ${
              reduce ? "" : "animate-floaty"
            }`}
            style={{ animationDelay: "0s" }}
          >
            📡 AI Prediction: 96% confidence
          </div>

          <div
            className={`absolute -bottom-4 -left-4 lg:-left-14 bg-white/[0.08] border border-white/[0.15] backdrop-blur-[12px] rounded-xl px-4 py-2.5 text-sm text-white z-20 ${
              reduce ? "" : "animate-floaty"
            }`}
            style={{ animationDelay: "2.5s" }}
          >
            ✅ Alert delivered to 12,400 citizens
          </div>
        </Reveal>
      </div>
    </section>
  );
}
