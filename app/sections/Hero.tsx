"use client";

import React from "react";
import { ArrowRight, Radio, Users, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import Eyebrow from "@/components/landing/ui/Eyebrow";

/* ------------------------------------------------------------------ */
/*  Stagger helpers                                                    */
/* ------------------------------------------------------------------ */
const stagger = (i: number) => i * 0.08;

const TRUST_STATS = [
  { value: "50M+", label: "Citizens Protected" },
  { value: "22", label: "States Connected" },
  { value: "9", label: "Alert Channels" },
  { value: "98.4%", label: "Delivery Success" },
];

const ALERT_CARDS = [
  {
    icon: <Radio size={16} className="text-red-400" />,
    value: "08",
    label: "Active Alerts",
    accent: "border-red-500/30 bg-red-500/[0.08]",
  },
  {
    icon: <Users size={16} className="text-blue-400" />,
    value: "286",
    label: "Rescue Teams",
    accent: "border-blue-500/30 bg-blue-500/[0.08]",
  },
  {
    icon: <MapPin size={16} className="text-emerald-400" />,
    value: "974",
    label: "Shelters",
    accent: "border-emerald-500/30 bg-emerald-500/[0.08]",
  },
];

/* ------------------------------------------------------------------ */
/*  Animated radar rings for the mockup                                */
/* ------------------------------------------------------------------ */
function RadarRings() {
  return (
    <div className="relative w-full h-[200px] flex items-center justify-center overflow-hidden rounded-xl bg-[#0a1628]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Concentric rings */}
      {[1, 2, 3, 4].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-[#2563EB]/20"
          style={{
            width: ring * 60,
            height: ring * 60,
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            delay: ring * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Center dot */}
      <div className="relative z-10 w-3 h-3 rounded-full bg-[#2563EB] shadow-[0_0_12px_rgba(37,99,235,0.6)]" />
      {/* Pins */}
      <motion.div
        className="absolute top-8 right-12 w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-[0_0_8px_rgba(249,115,22,0.5)]"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-16 w-2.5 h-2.5 rounded-full bg-[#2563EB] shadow-[0_0_8px_rgba(37,99,235,0.5)]"
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute top-14 left-10 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
        animate={{ y: [0, -5, 0] }}
        transition={{
          duration: 2.8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
      <motion.div
        className="absolute bottom-6 right-20 w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]"
        animate={{ y: [0, -3, 0] }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      />
      {/* Sweep line */}
      <motion.div
        className="absolute inset-0 origin-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute top-1/2 left-1/2 w-[45%] h-[1px] bg-gradient-to-r from-[#2563EB]/60 to-transparent" />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero section                                                       */
/* ------------------------------------------------------------------ */
export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 18% 20%, #12335e 0%, #0B1F3A 46%, #081527 100%)",
      }}
    >
      {/* Dot grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 70%)",
        }}
      />

      {/* Ambient glow blobs */}
      <div
        aria-hidden="true"
        className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] rounded-full bg-[#2563EB]/10 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-15%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#F97316]/[0.08] blur-[100px] pointer-events-none"
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 md:py-32 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* ---- Left Column (55%) ---- */}
          <div className="w-full lg:w-[55%] flex flex-col">
            <ScrollReveal delay={stagger(0)}>
              <Eyebrow variant="light" icon={<span>🛰</span>}>
                AI-Powered Disaster Management Platform
              </Eyebrow>
            </ScrollReveal>

            <ScrollReveal delay={stagger(1)}>
              <h1 className="mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-[3.75rem] font-extrabold leading-[1.1] tracking-tight text-white">
                Every Second{" "}
                <span className="block sm:inline">Saves Lives.</span>
                <br />
                <span className="bg-gradient-to-r from-[#2563EB] via-[#5B8DF6] to-[#F97316] bg-clip-text text-transparent">
                  No Citizen Left Unwarned.
                </span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={stagger(2)}>
              <p className="mt-6 text-lg md:text-xl text-[#C9D6EC] leading-relaxed max-w-xl">
                DisasterLink AI predicts floods, earthquakes, and cyclones before
                they strike — then delivers life-saving alerts across SMS,
                WhatsApp, sirens, and 6 more channels in seconds, reaching every
                citizen in every language.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={stagger(3)}>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#platform"
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full px-7 py-3.5 text-sm font-semibold shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300"
                >
                  Explore Platform
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 border border-white/20 text-white rounded-full px-7 py-3.5 text-sm font-medium hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                >
                  Request Demo
                </a>
              </div>
            </ScrollReveal>

            {/* Trust stats */}
            <ScrollReveal delay={stagger(4)}>
              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
                {TRUST_STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    <span className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                      {stat.value}
                    </span>
                    <span className="mt-1 text-xs text-[#C9D6EC]/70 uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* ---- Right Column (45%) — Dashboard Mockup ---- */}
          <div className="w-full lg:w-[45%] relative">
            <ScrollReveal delay={stagger(2)} animation="fade-left">
              <div className="relative">
                {/* Main glass card */}
                <div className="bg-white/[0.06] border border-white/[0.14] backdrop-blur-[18px] rounded-[22px] p-5 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                        LIVE NATIONAL FEED
                      </span>
                    </div>
                    <span className="text-[10px] text-white/40">
                      Updated 4s ago
                    </span>
                  </div>

                  {/* Radar area */}
                  <RadarRings />

                  {/* Bottom stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {ALERT_CARDS.map((card) => (
                      <div
                        key={card.label}
                        className={`rounded-xl border p-3 flex flex-col items-center gap-1 ${card.accent}`}
                      >
                        {card.icon}
                        <span className="text-lg font-bold text-white">
                          {card.value}
                        </span>
                        <span className="text-[10px] text-white/50 text-center leading-tight">
                          {card.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating chip — top right */}
                <motion.div
                  className="absolute -top-4 -right-4 md:-top-6 md:-right-8 bg-white/[0.08] backdrop-blur-[14px] border border-white/[0.14] rounded-2xl px-4 py-2.5 shadow-lg"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📡</span>
                    <div>
                      <p className="text-xs font-semibold text-white/90">
                        AI Prediction
                      </p>
                      <p className="text-[10px] text-emerald-400 font-medium">
                        96% confidence
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating chip — bottom left */}
                <motion.div
                  className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-8 bg-white/[0.08] backdrop-blur-[14px] border border-white/[0.14] rounded-2xl px-4 py-2.5 shadow-lg"
                  animate={{ y: [0, 8, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✅</span>
                    <div>
                      <p className="text-xs font-semibold text-white/90">
                        Alert delivered
                      </p>
                      <p className="text-[10px] text-[#5B8DF6] font-medium">
                        to 12,400 citizens
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
