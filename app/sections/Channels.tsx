"use client";

import React from "react";
import { Radio } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

/* ------------------------------------------------------------------ */
/*  Channel nodes positioned around the hub                            */
/* ------------------------------------------------------------------ */
const CHANNELS = [
  { emoji: "📻", label: "FM Radio", angle: 0 },
  { emoji: "📺", label: "Television", angle: 40 },
  { emoji: "✉️", label: "SMS", angle: 80 },
  { emoji: "📞", label: "Voice Calls", angle: 120 },
  { emoji: "💬", label: "WhatsApp", angle: 160 },
  { emoji: "✈️", label: "Telegram", angle: 200 },
  { emoji: "🚓", label: "Police Vehicles", angle: 240 },
  { emoji: "📢", label: "Panchayat PA", angle: 280 },
  { emoji: "🕌", label: "Religious PA", angle: 320 },
];

function ChannelHub() {
  const outerRadius = 210;
  const center = 260; /* half of the container size (520px) */

  return (
    <div className="relative w-[520px] h-[520px] mx-auto">
      {/* Dashed concentric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[340px] h-[340px] rounded-full border border-dashed border-white/[0.12]" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[460px] h-[460px] rounded-full border border-dashed border-white/[0.08]" />
      </div>

      {/* Pulse rings behind center */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-[#2563EB]/15"
          style={{
            width: 150 + ring * 40,
            height: 150 + ring * 40,
            top: center - (150 + ring * 40) / 2,
            left: center - (150 + ring * 40) / 2,
          }}
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 3,
            delay: ring * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Center hub */}
      <div
        className="absolute flex flex-col items-center justify-center rounded-full shadow-[0_0_60px_-10px_rgba(37,99,235,0.4)]"
        style={{
          width: 150,
          height: 150,
          top: center - 75,
          left: center - 75,
          background: "linear-gradient(135deg, #2563EB 0%, #F97316 100%)",
        }}
      >
        <Radio size={28} className="text-white mb-1" />
        <span className="text-[11px] font-bold text-white text-center leading-tight">
          AI Broadcast
          <br />
          Agent
        </span>
        <span className="text-[8px] text-white/60 mt-0.5">
          Multilingual · Redundant
        </span>
      </div>

      {/* Channel nodes */}
      {CHANNELS.map((ch, i) => {
        const rad = (ch.angle * Math.PI) / 180;
        const x = center + outerRadius * Math.cos(rad) - 26;
        const y = center + outerRadius * Math.sin(rad) - 26;

        return (
          <motion.div
            key={ch.label}
            className="absolute flex flex-col items-center gap-1.5 group cursor-default"
            style={{ left: x, top: y }}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              duration: 0.5,
              delay: i * 0.08,
              ease: [0.2, 0.7, 0.2, 1],
            }}
          >
            {/* Connector line from center */}
            <div
              className="absolute w-[1px] pointer-events-none"
              style={{
                height: outerRadius - 75,
                transformOrigin: "top center",
                top: 26,
                left: 25,
                background:
                  "linear-gradient(to bottom, rgba(37,99,235,0.25), transparent)",
                transform: `rotate(${ch.angle + 180}deg)`,
                opacity: 0.3,
              }}
            />
            <div className="w-[52px] h-[52px] rounded-[14px] bg-white/[0.07] border border-white/[0.16] backdrop-blur-[8px] flex items-center justify-center text-[22px] transition-all duration-200 group-hover:scale-[1.12] group-hover:bg-white/[0.14] group-hover:shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <span>{ch.emoji}</span>
            </div>
            <span className="text-[10px] text-white/60 text-center leading-tight font-medium whitespace-nowrap group-hover:text-white/90 transition-colors">
              {ch.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Channels Section                                                   */
/* ------------------------------------------------------------------ */
export default function Channels() {
  return (
    <section
      id="communication"
      className="relative py-28 overflow-hidden"
      style={{
        background: "linear-gradient(to bottom, #0B1F3A, #0d2545)",
      }}
    >
      {/* Dot grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 70%)",
        }}
      />

      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="absolute top-[10%] left-[30%] w-[500px] h-[500px] rounded-full bg-[#2563EB]/[0.06] blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="light"
            eyebrowIcon={<Radio size={14} />}
            eyebrow="Last-Mile Communication"
            title="One alert. Nine channels. Zero citizens missed."
            subtitle="When an AI-verified alert triggers, all nine channels fire in parallel — reaching every citizen regardless of connectivity, language, or location."
            onNavy
            center
          />
        </ScrollReveal>

        {/* Hub visualization */}
        <div className="mt-16 flex justify-center">
          <ScrollReveal delay={0.1} animation="scale">
            {/* Responsive wrapper: scale down on smaller screens */}
            <div className="transform scale-[0.55] sm:scale-[0.7] md:scale-[0.85] lg:scale-100 origin-center">
              <ChannelHub />
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom note */}
        <ScrollReveal delay={0.3}>
          <p className="mt-12 text-center text-sm text-[#C9D6EC]/70 max-w-2xl mx-auto leading-relaxed">
            Every channel fires in parallel within seconds of an AI-verified
            alert — with automatic fallback so a warning never depends on a
            single point of failure.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
