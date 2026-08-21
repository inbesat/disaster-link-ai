"use client";

import { useState } from "react";
import SectionHead from "@/components/landing/ui/SectionHead";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "How does SafeSphere reach citizens without internet or smartphones?",
    a: "We use 9 redundant communication channels including FM radio broadcasts, automated voice calls (IVR), SMS, police vehicle PA systems, village panchayat speakers, and religious institution PA networks. Even citizens with basic feature phones or no phone at all receive warnings through community broadcast systems.",
  },
  {
    q: "How accurate are the AI-powered disaster predictions?",
    a: "Our AI models achieve 96% prediction confidence by combining satellite imagery, IoT sensor data, weather APIs, and historical disaster patterns. Every prediction is verified against multiple data sources before alerts are triggered, minimizing false alarms while ensuring no real threat goes unwarned.",
  },
  {
    q: "Can local government bodies integrate their own systems?",
    a: "Yes. SafeSphere provides open APIs and integration guides for state and district-level systems. We support NDMA data formats, state SOPs, and can connect to existing emergency management software through our standardized data exchange protocols.",
  },
  {
    q: "What happens during a power outage or network failure?",
    a: "SafeSphere is designed for resilience. Our offline-first architecture caches critical data locally, and FM radio broadcasts continue independently of internet infrastructure. Field responders receive pre-synced checklists and shelter data that work without connectivity.",
  },
  {
    q: "Is this platform live, or a prototype?",
    a: "SafeSphere is currently in advanced demonstration stage, built for the Smart India Hackathon. All data shown on this page is simulated for demonstration purposes. The platform architecture is designed for production deployment with government agencies.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-[var(--bg-secondary)] py-28">
      <ScrollReveal>
        <SectionHead
          eyebrow="FAQ"
          eyebrowVariant="blue"
          title="Common questions"
          subtitle="Everything you need to know about SafeSphere"
          center={true}
          onNavy={true}
        />
      </ScrollReveal>

      <div className="max-w-[820px] mx-auto px-6 mt-12 space-y-4">
        {faqs.map((faq, i) => (
          <ScrollReveal key={i} delay={i * 0.08}>
            <div className="bg-white/5 border border-slate-800 rounded-lg overflow-hidden backdrop-blur-sm">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-white/5"
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="font-semibold text-white pr-4">
                  {faq.q}
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center shrink-0">
                  {openIndex === i ? (
                    <Minus className="text-[var(--accent-primary)]" size={16} />
                  ) : (
                    <Plus className="text-slate-300" size={16} />
                  )}
                </div>
              </button>
              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-5 pb-5">
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
