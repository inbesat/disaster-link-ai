"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  Shield,
  Truck,
  Megaphone,
  Users,
  Heart,
} from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";

// ---------------------------------------------------------------------
// app/sections/FeatureCards.tsx — Phase 2 · Prompt 2.3 — 3D Hover Cards
//
// 3-column feature card grid with:
//   - Glassmorphism background (bg-white/5 backdrop-blur border-white/10)
//   - Icon in colored circle
//   - Title + description
//   - On hover: lift (translateY(-8px)), shadow increase, border glow
//   - Staggered fade-in on scroll (50ms delay between cards)
// ---------------------------------------------------------------------

interface FeatureCard {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  glowColor: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: Brain,
    title: "Predict",
    description:
      "AI models analyze satellite imagery, IoT sensors, and weather data to forecast disasters hours before they strike.",
    accentColor: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.4)",
  },
  {
    icon: Shield,
    title: "Plan",
    description:
      "Dynamic risk maps identify danger zones and calculate optimal evacuation routes in real time.",
    accentColor: "#10b981",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    icon: Truck,
    title: "Respond",
    description:
      "Coordinate rescue teams, pre-position supplies, and deploy resources with AI-powered logistics.",
    accentColor: "#f59e0b",
    glowColor: "rgba(245, 158, 11, 0.4)",
  },
  {
    icon: Megaphone,
    title: "Alert",
    description:
      "Multilingual AI agent dispatches emergency alerts through 9 channels — FM, TV, SMS, WhatsApp, and more.",
    accentColor: "#ef4444",
    glowColor: "rgba(239, 68, 68, 0.4)",
  },
  {
    icon: Users,
    title: "Coordinate",
    description:
      "Match volunteers with tasks, track shelter capacity, and manage multi-agency response efforts.",
    accentColor: "#8b5cf6",
    glowColor: "rgba(139, 92, 246, 0.4)",
  },
  {
    icon: Heart,
    title: "Protect",
    description:
      "Locate missing persons, reunite families, and ensure vulnerable populations receive priority aid.",
    accentColor: "#ec4899",
    glowColor: "rgba(236, 72, 153, 0.4)",
  },
];

function Card({ feature, index }: { feature: FeatureCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
        ease: [0.2, 0.7, 0.2, 1],
      }}
      className="group relative"
    >
      <div
        className="relative h-full rounded-2xl p-7 transition-all duration-300 ease-out cursor-default
          bg-white/[0.04] backdrop-blur-sm border border-white/[0.08]
          hover:-translate-y-2 hover:bg-white/[0.07]
          hover:shadow-[0_20px_60px_-15px_var(--glow)]
          hover:border-[var(--accent)]"
        style={
          {
            "--accent": feature.accentColor,
            "--glow": feature.glowColor,
          } as React.CSSProperties
        }
      >
        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(400px circle at 50% 0%, ${feature.glowColor}, transparent 60%)`,
          }}
        />

        {/* Icon */}
        <div
          className="relative w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${feature.accentColor}15`,
          }}
        >
          <Icon
            size={26}
            style={{ color: feature.accentColor }}
            className="relative z-10"
          />
        </div>

        {/* Content */}
        <h3 className="relative z-10 text-xl font-semibold text-white mb-2">
          {feature.title}
        </h3>
        <p className="relative z-10 text-sm text-slate-400 leading-relaxed">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}

export default function FeatureCards() {
  return (
    <section className="py-24 relative" id="feature-cards">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Six pillars of disaster resilience
            </h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
              An end-to-end AI platform that predicts, prepares, and protects
              communities through every phase of a disaster.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <Card key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
