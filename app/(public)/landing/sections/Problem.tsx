"use client";

import { AlertCircle, LayoutGrid, Clock, AlertTriangle } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import TiltCard from "@/components/landing/ui/TiltCard";

export default function Problem() {
  const problems = [
    {
      icon: AlertCircle,
      title: "Last-Mile Blackout",
      desc: "Over 40% of rural villages receive disaster warnings too late — or not at all. Traditional broadcast systems fail where connectivity is weakest.",
    },
    {
      icon: LayoutGrid,
      title: "Fragmented Systems",
      desc: "State, district, and central agencies operate on disconnected platforms. Critical data sits in silos while response teams wait for coordination.",
    },
    {
      icon: Clock,
      title: "Delayed Response",
      desc: "Manual coordination between agencies adds hours to response times. In flood scenarios, every 30 minutes of delay puts thousands more at risk.",
    },
    {
      icon: AlertTriangle,
      title: "Misinformation Spread",
      desc: "During emergencies, unverified rumors spread faster than official alerts. Citizens make dangerous decisions based on false information.",
    },
  ];

  return (
    <section className="bg-primary py-28">
      <SectionHead
        eyebrow="The Problem"
        eyebrowVariant="orange"
        title="Disaster warnings still don't reach the people who need them most"
        subtitle="India's disaster management infrastructure remains fragmented — critical alerts are delayed, duplicated, or never delivered to the citizens who need them."
        center={true}
        onNavy={true}
      />

      <div className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.08}>
              <TiltCard maxTilt={7} perspective={1000} className="h-full rounded-xl">
                <div className="bg-white/5 border border-slate-800 rounded-xl p-7 hover:-translate-y-1.5 hover:border-[#F97316]/30 hover:bg-white/[0.07] transition-all duration-300 cursor-default group h-full">
                  <div className="w-[52px] h-[52px] rounded-lg bg-[#F97316]/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                    <item.icon className="text-[var(--orange)] w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
