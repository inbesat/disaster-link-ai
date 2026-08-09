"use client";

import React from "react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import LiveMapStats from "@/components/landing/command/LiveMapStats";
import AIPredictionDashboard from "@/components/landing/command/AIPredictionDashboard";
import AIDecisionEngine from "@/components/landing/command/AIDecisionEngine";
import EmergencyTimeline from "@/components/landing/command/EmergencyTimeline";
import IntelligencePipeline from "@/components/landing/command/IntelligencePipeline";
import ECCGrid from "@/components/landing/command/ECCGrid";

export default function CommandCenter() {
  return (
    <section
      id="command-center"
      className="relative py-28 overflow-hidden"
      style={{ background: "#081428" }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="absolute top-[-5%] right-[10%] w-[600px] h-[600px] rounded-full bg-[#2563EB]/[0.06] blur-[140px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-10%] left-[5%] w-[400px] h-[400px] rounded-full bg-[#F97316]/[0.04] blur-[120px] pointer-events-none"
      />

      {/* Dot grid overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <ScrollReveal>
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
            {/* Live tag */}
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.15em] bg-white/[0.06] border border-white/10 text-white/70 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              🛰 LIVE OPERATIONS PREVIEW · DEMO DATA
            </div>

            <h2 className="text-4xl md:text-5xl font-bold leading-tight text-white font-[family-name:var(--font-display)]">
              Inside the DisasterLink AI{" "}
              <span className="bg-gradient-to-r from-[#2563EB] via-[#5B8DF6] to-[#F97316] bg-clip-text text-transparent">
                Command Center
              </span>
            </h2>
            <p className="mt-4 text-lg text-[#C9D6EC] leading-relaxed">
              Real-time disaster detection, multi-channel alert dispatch, and
              coordinated rescue operations — all from a single unified
              dashboard.
            </p>
          </div>
        </ScrollReveal>

        {/* Live Map + Stats */}
        <ScrollReveal delay={0.1}>
          <LiveMapStats />
        </ScrollReveal>

        {/* AI Prediction Dashboard */}
        <div className="mt-8">
          <AIPredictionDashboard />
        </div>

        {/* AI Decision Engine + Emergency Timeline */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
          <ScrollReveal delay={0.05}>
            <AIDecisionEngine />
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <EmergencyTimeline />
          </ScrollReveal>
        </div>

        {/* Intelligence Pipeline (centered) */}
        <div className="mt-8">
          <ScrollReveal delay={0.05}>
            <IntelligencePipeline />
          </ScrollReveal>
        </div>

        {/* Emergency Command Center Grid */}
        <div className="mt-8">
          <ScrollReveal delay={0.05}>
            <ECCGrid />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
