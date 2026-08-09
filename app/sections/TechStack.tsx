"use client";

import React from "react";
import {
  Brain,
  Map,
  Satellite,
  Cloud,
  Cpu,
  Smartphone,
  Radio,
  CloudLightning,
} from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const STACK = [
  {
    icon: <Brain size={24} />,
    title: "AI / Machine Learning",
    description:
      "TensorFlow, PyTorch, and custom NLP models for flood prediction, image analysis, and misinformation detection.",
  },
  {
    icon: <Map size={24} />,
    title: "GIS Mapping",
    description:
      "MapLibre, PostGIS, and Turf.js power real-time risk heatmaps, evacuation routing, and shelter discovery.",
  },
  {
    icon: <Satellite size={24} />,
    title: "Satellite Data",
    description:
      "ISRO, Copernicus, and Sentinel feeds for real-time earth observation, flood extent mapping, and damage assessment.",
  },
  {
    icon: <CloudLightning size={24} />,
    title: "Weather APIs",
    description:
      "IMD, OpenWeather, and CWC river gauge data fused into unified precipitation and flood forecasting models.",
  },
  {
    icon: <Cpu size={24} />,
    title: "IoT Sensor Networks",
    description:
      "River level gauges, rain sensors, seismometers, and weather stations streaming live data via MQTT and LoRaWAN.",
  },
  {
    icon: <Cloud size={24} />,
    title: "Cloud Infrastructure",
    description:
      "AWS/GCP multi-region deployment with auto-scaling, CDN edge delivery, and 99.99% uptime SLA for critical alerts.",
  },
  {
    icon: <Smartphone size={24} />,
    title: "Mobile Application",
    description:
      "React Native cross-platform app with offline-first architecture, push notifications, and accessibility compliance.",
  },
  {
    icon: <Radio size={24} />,
    title: "SMS & Broadcast Gateway",
    description:
      "Twilio, BSNL, and custom IVRS integration for bulk SMS, voice calls, and PA system triggers across 9 channels.",
  },
];

export default function TechStack() {
  return (
    <section id="tech-stack" className="relative bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="blue"
            eyebrowIcon={<Cpu size={14} />}
            eyebrow="Technology"
            title="Powered by a modern, resilient stack"
            subtitle="Every layer is built for speed, redundancy, and scale — because disaster response infrastructure can never go down."
            onNavy={false}
            center
          />
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STACK.map((tech, i) => (
            <ScrollReveal key={tech.title} delay={(i % 4) * 0.08}>
              <div className="group bg-white border border-[#E7ECF3] rounded-[16px] p-6 text-center hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.25),0_20px_60px_-20px_rgba(249,115,22,0.35)] transition-all duration-300 h-full">
                {/* Icon badge */}
                <div className="w-14 h-14 rounded-[14px] bg-[rgba(11,31,58,0.06)] text-[#0B1F3A] flex items-center justify-center mx-auto mb-5 group-hover:bg-[#F97316]/10 group-hover:text-[#F97316] transition-colors duration-300">
                  {tech.icon}
                </div>

                <h4 className="text-base font-bold text-[#0F1B2D] mb-2">
                  {tech.title}
                </h4>
                <p className="text-[13px] leading-relaxed text-[#5B6B84]">
                  {tech.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
