"use client";

import { AlertCircle, LayoutGrid, Clock, AlertTriangle } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

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
    <section className="bg-white py-28">
      <SectionHead
        eyebrow="The Problem"
        eyebrowVariant="orange"
        title="Disaster warnings still don't reach the people who need them most"
        subtitle="India's disaster management infrastructure remains fragmented — critical alerts are delayed, duplicated, or never delivered to the citizens who need them."
        center={true}
      />

      <div className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((item, i) => (
            <ScrollReveal key={i} delay={i * 0.08}>
              <div className="bg-[#F8FAFC] border border-[#E7ECF3] rounded-[18px] p-7 hover:-translate-y-1.5 hover:shadow-[0_10px_40px_-12px_rgba(11,31,58,0.18)] transition-all duration-300 cursor-default group h-full">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[#F97316]/10 flex items-center justify-center mb-5">
                  <item.icon className="text-[#F97316] w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[#0F1B2D] mb-2">{item.title}</h3>
                <p className="text-sm text-[#5B6B84] leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
