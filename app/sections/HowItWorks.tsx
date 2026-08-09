"use client";

import React from "react";
import { Zap } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const STEPS = [
  {
    num: "01",
    title: "Detect",
    description:
      "Satellites, IoT sensors, river gauges, and weather stations continuously stream real-time data into the platform.",
  },
  {
    num: "02",
    title: "Predict",
    description:
      "AI models analyze multi-source data to forecast floods, cyclones, earthquakes, and heatwaves 6–72 hours in advance.",
  },
  {
    num: "03",
    title: "Verify",
    description:
      "Automated cross-validation against IMD, CWC, and seismic networks ensures zero false alarms before any alert fires.",
  },
  {
    num: "04",
    title: "Alert",
    description:
      "Verified warnings blast across 9 channels — SMS, WhatsApp, sirens, radio, TV — in 12+ languages within seconds.",
  },
  {
    num: "05",
    title: "Respond",
    description:
      "Rescue teams deploy, shelters activate, hospitals prepare, and citizens evacuate — all coordinated from one dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="blue"
            eyebrowIcon={<Zap size={14} />}
            eyebrow="How It Works"
            title="From detection to rescue in five steps"
            subtitle="A fully automated pipeline that turns raw sensor data into life-saving action — no human bottleneck, no delay."
            onNavy={false}
            center
          />
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.num} delay={i * 0.08}>
              <div className="group relative bg-white border border-[#E7ECF3] rounded-[18px] p-7 overflow-hidden hover:-translate-y-2 hover:border-[#2563EB]/30 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.2),0_20px_50px_-16px_rgba(37,99,235,0.25)] transition-all duration-300 h-full">
                {/* Large outlined number */}
                <div
                  className="text-[72px] font-extrabold leading-none mb-4 select-none"
                  style={{
                    WebkitTextStroke: "2px #2563EB",
                    WebkitTextFillColor: "transparent",
                    opacity: 0.2,
                    transition: "opacity 0.3s",
                  }}
                >
                  <span className="group-hover:opacity-100 transition-opacity">
                    {step.num}
                  </span>
                </div>

                {/* Connector dot */}
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-2 h-2 rounded-full bg-[#2563EB]/20 group-hover:bg-[#2563EB]/50 transition-colors z-10" />
                )}

                <h4 className="text-lg font-bold text-[#0F1B2D] mb-2 group-hover:text-[#2563EB] transition-colors">
                  {step.title}
                </h4>
                <p className="text-sm leading-relaxed text-[#5B6B84]">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Connector line between cards (desktop only) */}
        <div className="hidden lg:block relative -mt-[calc(50%+12px)] mx-[60px] h-0">
          <div className="border-t-2 border-dashed border-[#2563EB]/10 w-full" />
        </div>
      </div>
    </section>
  );
}
