"use client";

import React from "react";
import { WifiOff, LayoutGrid, Clock, AlertTriangle } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const stagger = (i: number) => i * 0.08;

const PROBLEMS = [
  {
    icon: <WifiOff size={24} />,
    title: "Last-Mile Blackout",
    description:
      "Remote villages and tribal areas remain unreachable. When cell towers fail and power grids collapse, millions are left in the dark — unaware that disaster is minutes away.",
  },
  {
    icon: <LayoutGrid size={24} />,
    title: "Fragmented Systems",
    description:
      "NDMA, SDMA, IMD, CWC, and district authorities all operate on disconnected platforms. Critical data sits in silos while responders scramble to piece together the full picture.",
  },
  {
    icon: <Clock size={24} />,
    title: "Delayed Response",
    description:
      "Manual coordination between agencies adds hours to response times. By the time rescue teams mobilize, evacuation windows have already closed and lives are lost.",
  },
  {
    icon: <AlertTriangle size={24} />,
    title: "Misinformation Spread",
    description:
      "In the absence of official updates, rumors flood WhatsApp and social media. Panic-driven misinformation triggers false evacuations and diverts resources from real emergencies.",
  },
];

export default function Problem() {
  return (
    <section id="problem" className="relative bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="orange"
            eyebrowIcon={<AlertTriangle size={14} />}
            eyebrow="The Problem"
            title="Disaster warnings still don't reach the people who need them most"
            subtitle="India's emergency infrastructure is fractured across dozens of agencies, protocols, and technologies — leaving the most vulnerable citizens unprotected when every second counts."
            onNavy={false}
            center
          />
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROBLEMS.map((problem, i) => (
            <ScrollReveal key={problem.title} delay={stagger(i + 1)}>
              <div className="group bg-[#F8FAFC] border border-[#E7ECF3] rounded-[18px] p-7 hover:-translate-y-1.5 hover:shadow-[0_10px_40px_-12px_rgba(11,31,58,0.18)] transition-all duration-300 h-full">
                {/* Icon badge */}
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F97316]/10 text-[#F97316] flex items-center justify-center mb-5 transition-colors duration-200 group-hover:bg-[#F97316]/[0.15]">
                  {problem.icon}
                </div>

                <h3 className="text-lg font-bold text-[#0F1B2D] mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#5B6B84]">
                  {problem.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
