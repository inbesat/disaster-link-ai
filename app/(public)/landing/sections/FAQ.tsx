"use client";

import { useState } from "react";
import SectionHead from "@/components/landing/ui/SectionHead";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "How does SafeSphere reach citizens without internet or smartphones?",
    a: "We use 9 redundant communication channels including FM radio broadcasts, automated voice calls (IVR), SMS, police vehicle PA systems, village panchayat speakers, and religious institution PA networks. Even citizens with basic feature phones or no phone at all receive warnings through community broadcast systems.",
  },
  {
    q: "How accurate are the AI predictions?",
    a: "Our AI models achieve 96% prediction confidence by combining satellite imagery, IoT sensor data, weather APIs, and historical disaster patterns. Every prediction is verified against multiple data sources before alerts are triggered, minimizing false alarms while ensuring no real threat goes unwarned.",
  },
  {
    q: "Can local government bodies integrate their own systems?",
    a: "Yes. SafeSphere provides open APIs and integration guides for state and district-level systems. We support NDMA data formats, state SOPs, and can connect to existing emergency management software through our standardized data exchange protocols.",
  },
  {
    q: "How is misinformation handled during a crisis?",
    a: "Our AI continuously monitors social media and messaging platforms during emergencies. Unverified rumors are flagged within seconds, and official counter-information is automatically distributed through all channels. Citizens receive only verified, authoritative updates.",
  },
  {
    q: "What languages are supported?",
    a: "Currently 12 languages: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, and English. All alerts are automatically translated and localized, including voice alerts with region-appropriate accents and dialects.",
  },
  {
    q: "Is this platform live, or a prototype?",
    a: "SafeSphere is currently in advanced demonstration stage, built for the Smart India Hackathon. All data shown on this page is simulated for demonstration purposes. The platform architecture is designed for production deployment with government agencies.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-secondary py-28">
      <SectionHead
        eyebrow="FAQ"
        eyebrowVariant="blue"
        title="Common questions"
        center={true}
        onNavy={true}
      />

      <div className="max-w-[820px] mx-auto px-6 mt-12 space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="bg-white/5 border border-slate-800 rounded-lg overflow-hidden"
          >
            <button
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span className="font-semibold text-white pr-4">{faq.q}</span>
              <div className="w-8 h-8 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center shrink-0">
                <Plus
                  className={`text-slate-300 transition-transform duration-300 ${openIndex === i ? "rotate-45" : ""}`}
                  size={16}
                />
              </div>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${openIndex === i ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
            >
              <div className="px-5 pb-5">
                <p className="text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
