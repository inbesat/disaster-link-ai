"use client";

import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import TiltCard from "@/components/landing/ui/TiltCard";

type GradientType = "blue" | "orange" | "navy";

export default function Features() {
  const features: {
    emoji: string;
    title: string;
    desc: string;
    gradient: GradientType;
  }[] = [
    {
      emoji: "🛰",
      title: "Early Disaster Prediction",
      desc: "AI models analyze satellite imagery, IoT sensor data, and weather patterns to forecast floods, cyclones, earthquakes, and heatwaves — hours before they strike.",
      gradient: "blue",
    },
    {
      emoji: "🗺",
      title: "Risk & Evacuation Routing",
      desc: "Dynamic risk maps identify danger zones and calculate optimal evacuation routes in real time, factoring in road conditions, shelter capacity, and population density.",
      gradient: "orange",
    },
    {
      emoji: "📡",
      title: "AI Communication & Broadcast Agent",
      desc: "Multilingual AI agent composes, translates, and dispatches emergency alerts simultaneously through 9 communication channels.",
      gradient: "navy",
    },
    {
      emoji: "📣",
      title: "Community Emergency Broadcasting",
      desc: "Local community leaders and panchayat officials can broadcast hyper-local emergency updates through village PA systems and religious institution speakers.",
      gradient: "blue",
    },
    {
      emoji: "🏠",
      title: "Shelter Discovery & Capacity Tracking",
      desc: "Live shelter maps show real-time capacity, amenities, accessibility features, and directions — helping citizens find the nearest safe shelter instantly.",
      gradient: "orange",
    },
    {
      emoji: "👪",
      title: "Missing Persons & Reunification",
      desc: "AI-powered matching system helps locate and reunite separated family members using photo recognition, last-known location, and shelter registrations.",
      gradient: "navy",
    },
    {
      emoji: "📷",
      title: "Crowdsourced Incident Reporting",
      desc: "Citizens submit real-time ground reports with photos, location, and severity assessments — verified by AI before being added to the situational picture.",
      gradient: "blue",
    },
    {
      emoji: "🛡",
      title: "Misinformation Detection",
      desc: "AI monitors social media and messaging platforms during crises, flagging unverified rumors and automatically countering them with official information.",
      gradient: "orange",
    },
    {
      emoji: "🙋",
      title: "Volunteer Matching & Coordination",
      desc: "Matches registered volunteers with tasks based on skills, location, and availability — from medical aid to debris clearing to supply distribution.",
      gradient: "navy",
    },
    {
      emoji: "📦",
      title: "Predictive Resource Allocation",
      desc: "AI predicts resource needs based on disaster type, affected population, and historical patterns — pre-positioning supplies before disasters hit.",
      gradient: "blue",
    },
    {
      emoji: "♿",
      title: "Accessibility for All",
      desc: "Voice alerts, large-text mode, screen reader support, and IVR (phone-based) alerts ensure no citizen is excluded — regardless of ability or device.",
      gradient: "orange",
    },
    {
      emoji: "📊",
      title: "Post-Disaster Recovery Dashboard",
      desc: "Comprehensive recovery tracking: infrastructure damage assessment, relief distribution monitoring, and long-term rehabilitation planning.",
      gradient: "navy",
    },
  ];

  const getBadgeGradient = (gradient: GradientType) => {
    switch (gradient) {
      case "blue":
        return "bg-gradient-to-br from-[#2563EB]/15 to-[#5B8DF6]/15";
      case "orange":
        return "bg-gradient-to-br from-[#F97316]/15 to-[#FDBA74]/15";
      case "navy":
        return "bg-gradient-to-br from-[#0B1F3A]/10 to-[#132f57]/10";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <section className="bg-[#0a0f1a] py-28" id="features">
      <SectionHead
        eyebrow="AI Features"
        eyebrowVariant="blue"
        title="A complete AI toolkit for disaster resilience"
        subtitle="12 integrated AI modules working together to predict, prevent, respond, and recover."
        center={true}
        onNavy={true}
      />

      <div className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const delay = Math.min(i * 0.06, 0.36);
            return (
              <ScrollReveal key={i} delay={delay}>
                <TiltCard
                  maxTilt={6}
                  perspective={1000}
                  className="h-full rounded-[18px]"
                >
                  <div className="bg-white/5 border border-slate-800 rounded-[18px] p-7 relative overflow-hidden group hover:-translate-y-1 hover:border-[#2563EB]/30 hover:bg-white/[0.07] transition-all duration-300 h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2563EB]/5 to-[#F97316]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    <div
                      className={`w-[52px] h-[52px] rounded-[14px] flex items-center justify-center text-[24px] mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300 ${getBadgeGradient(feature.gradient)} relative z-10`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {feature.emoji}
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 relative z-10">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-slate-400 leading-relaxed relative z-10">
                      {feature.desc}
                    </p>
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}