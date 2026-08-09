"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const stagger = (i: number) => i * 0.08;

const FEATURES = [
  {
    emoji: "🛰",
    title: "Early Disaster Prediction",
    description:
      "AI models analyze satellite imagery, river gauges, seismic sensors, and weather data to forecast floods, earthquakes, and cyclones 6–72 hours in advance.",
    gradient: "from-[#2563EB]/15 to-[#5B8DF6]/10",
    iconBg: "bg-gradient-to-br from-[#2563EB] to-[#5B8DF6]",
  },
  {
    emoji: "🗺",
    title: "Risk & Evacuation Routing",
    description:
      "Dynamic risk heatmaps and real-time evacuation routes adapt to road closures, flood levels, and population density — guiding citizens to safety.",
    gradient: "from-[#F97316]/15 to-[#FDBA74]/10",
    iconBg: "bg-gradient-to-br from-[#F97316] to-[#FDBA74]",
  },
  {
    emoji: "📡",
    title: "AI Communication Agent",
    description:
      "An intelligent broadcast agent composes, translates, and dispatches alerts across 9 channels simultaneously in 12+ languages within seconds.",
    gradient: "from-[#0B1F3A]/10 to-[#2563EB]/10",
    iconBg: "bg-gradient-to-br from-[#0B1F3A] to-[#132f57]",
  },
  {
    emoji: "📣",
    title: "Community Broadcasting",
    description:
      "Hyperlocal alerts reach gram panchayats, religious institutions, and community leaders — activating ground-level response networks instantly.",
    gradient: "from-[#2563EB]/15 to-[#5B8DF6]/10",
    iconBg: "bg-gradient-to-br from-[#2563EB] to-[#5B8DF6]",
  },
  {
    emoji: "🏠",
    title: "Shelter Discovery & Tracking",
    description:
      "Citizens find the nearest open shelter with real-time capacity, accessibility info, and turn-by-turn navigation — even offline via SMS.",
    gradient: "from-[#F97316]/15 to-[#FDBA74]/10",
    iconBg: "bg-gradient-to-br from-[#F97316] to-[#FDBA74]",
  },
  {
    emoji: "👪",
    title: "Missing Persons Reunification",
    description:
      "AI-powered face matching and family registration help reunite separated families across shelters, hospitals, and relief camps.",
    gradient: "from-[#0B1F3A]/10 to-[#2563EB]/10",
    iconBg: "bg-gradient-to-br from-[#0B1F3A] to-[#132f57]",
  },
  {
    emoji: "📷",
    title: "Crowdsourced Reporting",
    description:
      "Citizens submit geo-tagged photos, voice notes, and text reports from the ground — verified by AI and routed to the nearest response team.",
    gradient: "from-[#2563EB]/15 to-[#5B8DF6]/10",
    iconBg: "bg-gradient-to-br from-[#2563EB] to-[#5B8DF6]",
  },
  {
    emoji: "🛡",
    title: "Misinformation Detection",
    description:
      "NLP models scan social media and messaging platforms in real time, flagging and countering false rumors before they cause panic.",
    gradient: "from-[#F97316]/15 to-[#FDBA74]/10",
    iconBg: "bg-gradient-to-br from-[#F97316] to-[#FDBA74]",
  },
  {
    emoji: "🙋",
    title: "Volunteer Coordination",
    description:
      "Skill-matched volunteers are auto-dispatched to nearby incidents based on location, availability, training, and real-time demand.",
    gradient: "from-[#0B1F3A]/10 to-[#2563EB]/10",
    iconBg: "bg-gradient-to-br from-[#0B1F3A] to-[#132f57]",
  },
  {
    emoji: "📦",
    title: "Predictive Resource Allocation",
    description:
      "AI forecasts resource needs — food, water, medicine, tarps — before demand spikes, pre-positioning supplies at optimal distribution points.",
    gradient: "from-[#2563EB]/15 to-[#5B8DF6]/10",
    iconBg: "bg-gradient-to-br from-[#2563EB] to-[#5B8DF6]",
  },
  {
    emoji: "♿",
    title: "Accessibility for All",
    description:
      "Multilingual voice alerts, sign-language video, high-contrast UI, and offline SMS ensure no citizen is excluded — regardless of ability or connectivity.",
    gradient: "from-[#F97316]/15 to-[#FDBA74]/10",
    iconBg: "bg-gradient-to-br from-[#F97316] to-[#FDBA74]",
  },
  {
    emoji: "📊",
    title: "Recovery Dashboard",
    description:
      "Post-disaster analytics track damage assessment, relief distribution, shelter occupancy, and citizen feedback to accelerate recovery.",
    gradient: "from-[#0B1F3A]/10 to-[#2563EB]/10",
    iconBg: "bg-gradient-to-br from-[#0B1F3A] to-[#132f57]",
  },
];

export default function Features() {
  return (
    <section id="platform" className="relative bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="blue"
            eyebrowIcon={<Sparkles size={14} />}
            eyebrow="AI Features"
            title="A complete AI toolkit for disaster resilience"
            subtitle="From the first sensor reading to the last relief package — 12 integrated capabilities that work together as one intelligent system."
            onNavy={false}
            center
          />
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={stagger(i % 6)}>
              <div className="group relative bg-white border border-[#E7ECF3] rounded-[18px] p-7 overflow-hidden hover:-translate-y-2 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.25),0_20px_60px_-20px_rgba(37,99,235,0.45)] transition-all duration-300 h-full">
                {/* Hover gradient overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />

                <div className="relative z-10">
                  {/* Icon badge */}
                  <div
                    className={`w-[52px] h-[52px] rounded-[14px] ${feature.iconBg} flex items-center justify-center text-[24px] shadow-sm mb-5`}
                  >
                    <span>{feature.emoji}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#0F1B2D] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#5B6B84]">
                    {feature.description}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
