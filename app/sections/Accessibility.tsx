"use client";

import React from "react";
import { Globe, Phone, Eye, WifiOff, Volume2 } from "lucide-react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const LANGUAGES = [
  "हिंदी",
  "বাংলা",
  "தமிழ்",
  "తెలుగు",
  "मराठी",
  "ગુજરાતી",
  "ಕನ್ನಡ",
  "മലയാളം",
  "ਪੰਜਾਬੀ",
  "ଓଡ଼ିଆ",
  "অসমীয়া",
  "English",
];

const FEATURES = [
  {
    icon: <Phone size={20} />,
    title: "Voice & IVR Alerts",
    description:
      "Automated voice calls in local languages reach citizens without smartphones — just a basic phone is enough to receive life-saving instructions.",
  },
  {
    icon: <Eye size={20} />,
    title: "Large-Text & Screen Reader Mode",
    description:
      "High-contrast UI, scalable fonts, and full screen reader compatibility ensure visually impaired citizens can navigate every feature.",
  },
  {
    icon: <WifiOff size={20} />,
    title: "Offline-First Sync",
    description:
      "Critical data — shelter locations, evacuation routes, emergency contacts — cached locally and synced when connectivity returns.",
  },
  {
    icon: <Volume2 size={20} />,
    title: "Village PA Network Integration",
    description:
      "Alerts trigger gram panchayat loudspeakers, temple/mosque PA systems, and community sirens — reaching citizens who are offline entirely.",
  },
];

export default function Accessibility() {
  return (
    <section id="accessibility" className="relative bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start gap-14 lg:gap-20">
          {/* ---- Left Column ---- */}
          <div className="w-full lg:w-1/2">
            <ScrollReveal>
              <SectionHead
                eyebrowVariant="orange"
                eyebrowIcon={<Globe size={14} />}
                eyebrow="Accessibility"
                title="Built for every citizen, every device, every connection"
                subtitle="From 5G smartphones in metros to basic feature phones in tribal villages — DisasterLink AI reaches every citizen in their language, on their device, at their connectivity level."
                onNavy={false}
                center={false}
              />
            </ScrollReveal>

            {/* Language chips */}
            <ScrollReveal delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {LANGUAGES.map((lang) => (
                  <span
                    key={lang}
                    className="bg-white border border-[#E7ECF3] rounded-full px-4 py-2 text-sm font-semibold text-[#0B1F3A] hover:border-[#F97316]/30 hover:bg-[#F97316]/[0.04] transition-colors duration-200 cursor-default select-none"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* ---- Right Column — Feature Cards ---- */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {FEATURES.map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 0.08}>
                <div className="flex items-start gap-4 bg-[#F8FAFC] border border-[#E7ECF3] rounded-[16px] p-5 hover:-translate-y-1 hover:shadow-[0_10px_40px_-12px_rgba(11,31,58,0.12)] transition-all duration-300">
                  {/* Orange icon badge */}
                  <div className="w-11 h-11 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#0F1B2D] mb-1">
                      {feature.title}
                    </h5>
                    <p className="text-[13px] leading-relaxed text-[#5B6B84]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
