"use client";

import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import TiltCard from "@/components/landing/ui/TiltCard";
import {
  Brain,
  Globe,
  Satellite,
  Cloud,
  Cpu,
  Server,
  Smartphone,
  Radio,
} from "lucide-react";

const techs = [
  { icon: Brain, title: "AI / Machine Learning" },
  { icon: Globe, title: "GIS Mapping" },
  { icon: Satellite, title: "Satellite Data" },
  { icon: Cloud, title: "Weather APIs" },
  { icon: Cpu, title: "IoT Sensor Networks" },
  { icon: Server, title: "Cloud Infrastructure" },
  { icon: Smartphone, title: "Mobile Application" },
  { icon: Radio, title: "SMS & Broadcast Gateway" },
];

export default function TechStack() {
  return (
    <section className="bg-primary py-28">
      <SectionHead
        eyebrow="Technology"
        eyebrowVariant="blue"
        title="Powered by a modern, resilient stack"
        center={true}
        onNavy={true}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto px-6 mt-16">
        {techs.map((tech, i) => {
          const Icon = tech.icon;
          return (
            <ScrollReveal key={i} delay={i * 0.05} animation="fade-up">
              <TiltCard maxTilt={9} perspective={900} glare={false} className="h-full rounded-[var(--radius-xl5)]">
                <div className="bg-white/5 border border-slate-800 rounded-[var(--radius-xl5)] p-6 text-center hover:-translate-y-1.5 hover:border-[#F97316]/30 hover:bg-white/[0.07] transition-all duration-300 h-full">
                  <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-[var(--blue-light)]" size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{tech.title}</h3>
                </div>
              </TiltCard>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
