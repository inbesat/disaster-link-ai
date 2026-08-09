"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import { useCountUp } from "@/components/landing/hooks/useCountUp";

const STATS = [
  { value: 52, suffix: "M+", label: "Citizens Protected" },
  { value: 1280, suffix: "", label: "Villages Connected" },
  { value: 98, suffix: "%", label: "Alert Delivery Rate" },
  { value: 41, suffix: " min", label: "Avg Warning Lead Time" },
];

function ImpactStat({
  stat,
  delay,
}: {
  stat: (typeof STATS)[0];
  delay: number;
}) {
  const { ref, count } = useCountUp(stat.value, 2000);

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <div
        ref={ref}
        className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-gradient-to-r from-white to-[#BFD3FF] bg-clip-text text-transparent tabular-nums"
      >
        {count.toLocaleString("en-IN")}
        {stat.suffix}
      </div>
      <span className="mt-3 text-sm text-[#C9D6EC]/70 uppercase tracking-wider font-medium">
        {stat.label}
      </span>
    </motion.div>
  );
}

export default function Impact() {
  return (
    <section
      id="impact"
      className="relative py-28 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0B1F3A 0%, #0c2a52 100%)",
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

      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-[#2563EB]/[0.06] blur-[140px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-10%] right-[15%] w-[400px] h-[400px] rounded-full bg-[#F97316]/[0.04] blur-[120px] pointer-events-none"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="light"
            eyebrowIcon={<TrendingUp size={14} />}
            eyebrow="Impact"
            title="Measurable protection, at national scale"
            subtitle="Real numbers from real deployments — every metric represents lives protected and response times shortened."
            onNavy
            center
          />
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-6">
          {STATS.map((stat, i) => (
            <ImpactStat key={stat.label} stat={stat} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
