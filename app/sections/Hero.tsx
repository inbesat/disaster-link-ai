"use client";

import React from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Satellite,
  ArrowRight,
  Radio,
  BellRing,
  ShieldCheck,
  Siren,
  Home,
  Waves,
  CloudLightning,
  HeartPulse,
} from "lucide-react";
import TiltCard from "@/components/landing/ui/TiltCard";

const TRUST_STATS = [
  { value: "50M+", label: "Citizens Protected" },
  { value: "22", label: "States Connected" },
  { value: "9", label: "Alert Channels" },
  { value: "98.4%", label: "Delivery Success" },
];

const FEED_STATS = [
  { value: "08", label: "Active Alerts", icon: Siren },
  { value: "286", label: "Rescue Teams", icon: HeartPulse },
  { value: "974", label: "Shelters", icon: Home },
];

const EASE = [0.2, 0.7, 0.2, 1] as const;

function Reveal({
  children,
  delay = 0,
  className = "",
  y = 26,
  z = 0,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  /** translateZ depth when inside a preserve-3d context */
  z?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={z ? { z, transform: `translateZ(${z}px)` } : undefined}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Parallax background orbs that drift with scroll */
function ParallaxOrbs() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  if (reduce) return null;
  return (
    <>
      <motion.div
        style={{ y: y1 }}
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#2563EB]/20 blur-[120px] pointer-events-none"
      />
      <motion.div
        style={{ y: y2 }}
        aria-hidden="true"
        className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-[#F97316]/15 blur-[130px] pointer-events-none"
      />
      <motion.div
        style={{ y: y3 }}
        aria-hidden="true"
        className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full bg-[#132F57]/80 blur-[100px] pointer-events-none"
      />
    </>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: undefined,
    offset: ["start start", "end start"],
  });
  /* Scroll-linked 3D depth: mockup rises + scales while copy parallaxes
     slower — the Apple-style scroll choreography. */
  const mockY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const mockScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const orbOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.4]);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden" id="hero">
      {/* Background */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, #12335e 0%, #0B1F3A 46%, #081527 100%)",
        }}
      />
      {/* Dot-grid overlay */}
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
      <ParallaxOrbs />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-14 lg:gap-12 items-center py-28 lg:py-20 w-full [perspective:1800px]">
        {/* Left column */}
        <motion.div style={reduce ? undefined : { y: copyY, opacity: orbOpacity }}>
          <Reveal delay={0}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/90">
              <Satellite size={14} className="text-[#5B8DF6]" aria-hidden="true" />
              AI-Powered Disaster Management Platform
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mt-6 font-[family-name:var(--font-display)]">
              Every Second
              <br />
              Saves Lives.
              <br />
              <span className="bg-gradient-to-r from-[#5B8DF6] via-[#F97316] to-[#FDBA74] bg-clip-text text-transparent">
                No Citizen Left Unwarned.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-lg text-[#C9D6EC] mt-6 max-w-xl leading-relaxed">
              DisasterLink AI predicts disasters before they strike and delivers critical
              alerts across 9 communication channels — FM, TV, SMS, WhatsApp, Telegram and
              village loudspeakers — reaching every citizen, even where the internet goes dark.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap gap-4 mt-8">
              <a
                href="#platform"
                className="btn btn-primary rounded-full px-8 py-3.5 text-base font-semibold normal-case font-sans items-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] border-0 text-white shadow-[0_12px_30px_-10px_rgba(37,99,235,0.55)] hover:shadow-[0_20px_60px_-20px_rgba(37,99,235,0.6)] hover:-translate-y-0.5 transition-all"
              >
                Explore Platform <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a
                href="#contact"
                className="btn btn-ghost rounded-full border border-white/25 text-white px-8 py-3.5 text-base hover:bg-white/10 hover:border-white/40 normal-case font-sans transition-all"
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
                  className={`flex flex-col ${idx > 0 ? "md:border-l md:border-white/10 md:pl-6" : ""}`}
                >
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[#C9D6EC] uppercase tracking-wider mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </motion.div>

        {/* Right column — 3D tilted dashboard mockup */}
        <motion.div
          style={
            reduce
              ? undefined
              : { y: mockY, scale: mockScale, transformStyle: "preserve-3d" }
          }
        >
        <Reveal delay={0.35} y={34} className="relative">
          <TiltCard maxTilt={9} perspective={1200} className="rounded-[26px]">
            <div className="bg-white/[0.06] border border-white/[0.14] backdrop-blur-[18px] rounded-[26px] p-5 relative z-10 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.7)] [transform-style:preserve-3d]">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${reduce ? "" : "animate-ping"}`} />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[10px] font-semibold tracking-widest text-white/70">
                    LIVE NATIONAL FEED
                  </span>
                </div>
                <span className="text-[10px] text-white/40 tabular-nums">Updated 4s ago</span>
              </div>

              {/* Radar map */}
              <div className="h-[200px] relative flex items-center justify-center bg-[rgba(37,99,235,0.05)] rounded-xl overflow-hidden">
                <div
                  className={`absolute w-[70px] h-[70px] rounded-full border border-[#2563EB]/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${reduce ? "" : "motion-safe:animate-mpulse"}`}
                  style={{ animationDelay: "0s" }}
                />
                <div
                  className={`absolute w-[70px] h-[70px] rounded-full border border-[#F97316]/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${reduce ? "" : "motion-safe:animate-mpulse"}`}
                  style={{ animationDelay: "1.1s" }}
                />
                <div
                  className={`absolute w-[70px] h-[70px] rounded-full border border-emerald-400/25 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${reduce ? "" : "motion-safe:animate-mpulse"}`}
                  style={{ animationDelay: "2.2s" }}
                />
                <div className="absolute w-[130px] h-[130px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute w-[64px] h-[64px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute w-2 h-2 rounded-full bg-white/60 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

                {/* Pins */}
                <span
                  className={`absolute w-3 h-3 bg-[#2563EB] rounded-full top-1/4 left-1/3 ${reduce ? "" : "animate-dotpulse"}`}
                  aria-hidden="true"
                />
                <span
                  className={`absolute w-3 h-3 bg-[#F97316] rounded-full top-2/3 right-1/4 ${reduce ? "" : "animate-dotpulse"}`}
                  style={{ animationDelay: "0.6s" }}
                  aria-hidden="true"
                />
                <span
                  className={`absolute w-3 h-3 bg-emerald-400 rounded-full bottom-1/4 left-1/2 ${reduce ? "" : "animate-dotpulse"}`}
                  style={{ animationDelay: "1.2s" }}
                  aria-hidden="true"
                />

                {/* Floating hazard chips inside radar (3D depth) */}
                <motion.span
                  initial={reduce ? false : { opacity: 0, y: -8 }}
                  animate={reduce ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-white/10 border border-white/15 backdrop-blur px-2 py-1 text-[9px] font-semibold text-white/80"
                >
                  <Waves size={10} className="text-[#5B8DF6]" aria-hidden="true" /> Flood · Ganga
                </motion.span>
                <motion.span
                  initial={reduce ? false : { opacity: 0, y: -8 }}
                  animate={reduce ? {} : { opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-white/10 border border-white/15 backdrop-blur px-2 py-1 text-[9px] font-semibold text-white/80"
                >
                  <CloudLightning size={10} className="text-[#FDBA74]" aria-hidden="true" /> Cyclone · Odisha
                </motion.span>
              </div>

              {/* Bottom stats grid */}
              <div className="grid grid-cols-3 gap-3 mt-4" style={{ transform: "translateZ(30px)" }}>
                {FEED_STATS.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={reduce ? false : { opacity: 0, y: 14 }}
                      animate={reduce ? {} : { opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.85 + idx * 0.1, ease: EASE }}
                      className="bg-white/[0.06] rounded-xl p-3 text-center border border-white/[0.06]"
                    >
                      <Icon size={14} className="mx-auto mb-1 text-[#5B8DF6]" aria-hidden="true" />
                      <div className="text-xl font-bold text-white tabular-nums">{stat.value}</div>
                      <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">
                        {stat.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </TiltCard>

          {/* Floating chips — layered at different 3D depths */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={reduce ? {} : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            style={{ transform: "translateZ(60px)" }}
            className={`absolute top-4 -right-4 lg:-right-14 bg-[#0B1F3A]/85 border border-white/[0.15] backdrop-blur-[12px] rounded-xl px-4 py-2.5 text-sm text-white z-30 shadow-xl ${reduce ? "" : "animate-floaty"}`}
          >
            <span className="flex items-center gap-2">
              <Radio size={14} className="text-[#FDBA74]" aria-hidden="true" />
              AI Prediction: 96% confidence
            </span>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={reduce ? {} : { opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            style={{ transform: "translateZ(45px)" }}
            className={`absolute -bottom-4 -left-4 lg:-left-16 bg-[#0B1F3A]/85 border border-white/[0.15] backdrop-blur-[12px] rounded-xl px-4 py-2.5 text-sm text-white z-30 shadow-xl ${reduce ? "" : "animate-floaty"}`}
            // second floaty chip with inverted delay via inline style
          >
            <span
              className="flex items-center gap-2"
              style={{ animationDelay: "2.5s" }}
            >
              <BellRing size={14} className="text-emerald-400" aria-hidden="true" />
              Alert delivered to 12,400 citizens
            </span>
          </motion.div>

          {/* Small verified badge */}
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={reduce ? {} : { opacity: 1, scale: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            style={{ transform: "translateZ(80px)" }}
            className="absolute -top-6 left-8 w-11 h-11 rounded-full bg-gradient-to-br from-[#2563EB] to-[#F97316] flex items-center justify-center text-white shadow-[0_0_0_4px_rgba(11,31,58,0.9),0_10px_30px_-8px_rgba(37,99,235,0.6)] z-30"
          >
            <ShieldCheck size={20} aria-hidden="true" />
          </motion.div>
        </Reveal>
        </motion.div>
      </div>
    </section>
  );
}