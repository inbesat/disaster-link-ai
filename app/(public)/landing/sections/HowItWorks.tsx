"use client";

import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import TiltCard from "@/components/landing/ui/TiltCard";

const steps = [
  {
    num: "01",
    title: "Detect",
    desc: "Satellites, IoT sensors, and weather stations continuously monitor environmental conditions across the country.",
  },
  {
    num: "02",
    title: "Predict",
    desc: "AI models analyze incoming data to forecast disaster probability, severity, and affected zones hours in advance.",
  },
  {
    num: "03",
    title: "Verify",
    desc: "Automated verification cross-references multiple data sources and human intelligence to eliminate false alarms.",
  },
  {
    num: "04",
    title: "Alert",
    desc: "Verified warnings are broadcast simultaneously through 9 communication channels in local languages.",
  },
  {
    num: "05",
    title: "Respond",
    desc: "Rescue teams are dispatched with optimal routing while shelters activate and hospitals prepare capacity.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-28">
      <SectionHead
        eyebrow="How It Works"
        eyebrowVariant="blue"
        title="From detection to rescue in five steps"
        center={true}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto px-6 mt-16">
        {steps.map((step, i) => (
          <ScrollReveal key={i} delay={i * 0.08} animation="fade-up">
            <TiltCard maxTilt={8} perspective={1100} glare={false} className="h-full rounded-[18px]">
              <div className="bg-white border border-[#E7ECF3] rounded-[18px] p-7 text-center hover:border-[#2563EB] hover:shadow-[0_0_0_1px_rgba(37,99,235,0.25),0_20px_60px_-20px_rgba(37,99,235,0.45)] hover:-translate-y-2 transition-all duration-300 group h-full">
                <div
                  className="text-6xl font-extrabold leading-none mb-4"
                  style={{
                    WebkitTextStroke: "2px #2563EB",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {step.num}
                </div>
                <h3 className="text-lg font-bold text-[#0F1B2D] mb-2">{step.title}</h3>
                <p className="text-sm text-[#5B6B84] leading-relaxed">{step.desc}</p>
              </div>
            </TiltCard>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
