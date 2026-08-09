"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const stagger = (i: number) => i * 0.08;

const PILLARS = [
  {
    num: "01",
    title: "Predict Early",
    description:
      "AI models ingest satellite imagery, river gauge data, seismic feeds, and weather forecasts to predict disasters 6–72 hours before they strike.",
  },
  {
    num: "02",
    title: "Broadcast Everywhere",
    description:
      "Alerts blast simultaneously across SMS, WhatsApp, IVRS calls, sirens, PA systems, radio, TV crawls, app push, and loudspeaker drones — in 12+ languages.",
  },
  {
    num: "03",
    title: "Coordinate Response",
    description:
      "A unified command center lets NDMA, SDMA, district collectors, rescue teams, and NGOs share live data, allocate resources, and track every operation in real time.",
  },
  {
    num: "04",
    title: "Recover Faster",
    description:
      "Post-disaster damage assessment, shelter management, relief distribution tracking, and citizen feedback loops accelerate recovery and rebuild trust.",
  },
];

export default function Solution() {
  return (
    <section id="solution" className="relative bg-[#F8FAFC] py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start gap-14 lg:gap-20">
          {/* ---- Left Column (40%) ---- */}
          <div className="w-full lg:w-[40%]">
            <ScrollReveal>
              <SectionHead
                eyebrowVariant="blue"
                eyebrowIcon={<Sparkles size={14} />}
                eyebrow="Our Solution"
                title="One AI platform connecting prediction, broadcast, and rescue"
                subtitle="DisasterLink AI unifies the entire disaster lifecycle — from the first sensor reading to the last relief package — into a single intelligent system."
                onNavy={false}
                center={false}
              />
            </ScrollReveal>

            {/* Numbered pillars */}
            <div className="mt-10 flex flex-col gap-8">
              {PILLARS.map((pillar, i) => (
                <ScrollReveal key={pillar.num} delay={stagger(i + 1)}>
                  <div className="flex gap-4">
                    {/* Number circle */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center text-sm font-bold">
                      {pillar.num}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-[#0F1B2D] mb-1">
                        {pillar.title}
                      </h4>
                      <p className="text-sm leading-relaxed text-[#5B6B84]">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* ---- Right Column (60%) — Image Card ---- */}
          <div className="w-full lg:w-[60%]">
            <ScrollReveal delay={stagger(2)} animation="fade-left">
              <div className="relative rounded-[22px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(11,31,58,0.22)]">
                {/* Command center image */}
                <div
                  className="w-full h-[420px] md:h-[520px] bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80')",
                  }}
                >
                  {/* Dark gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/80 via-[#0B1F3A]/20 to-transparent" />
                </div>

                {/* Overlay badge at bottom */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="bg-[rgba(11,31,58,0.75)] backdrop-blur-[10px] border border-white/10 rounded-[14px] p-4 flex items-center gap-3">
                    {/* Pulsing green dot */}
                    <div className="relative flex-shrink-0">
                      <div className="w-3 h-3 rounded-full bg-emerald-400" />
                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <p className="text-sm font-medium text-white/90 leading-snug">
                      Real-time coordination across every response agency —
                      from prediction to last-mile delivery
                    </p>
                  </div>
                </div>

                {/* Top-right floating stat badge */}
                <div className="absolute top-5 right-5">
                  <div className="bg-[rgba(11,31,58,0.65)] backdrop-blur-[10px] border border-white/10 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#5B8DF6]" />
                      <span className="text-xs font-semibold text-white/90">
                        AI-Powered Command Center
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
