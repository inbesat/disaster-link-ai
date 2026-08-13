"use client";

import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import Eyebrow from "@/components/landing/ui/Eyebrow";

export default function Solution() {
  const pillars = [
    {
      num: "01",
      title: "Predict Early",
      desc: "AI models analyze satellite imagery, weather data, and sensor readings to predict disasters hours before they strike.",
    },
    {
      num: "02",
      title: "Broadcast Everywhere",
      desc: "Alerts reach citizens through SMS, voice calls, WhatsApp, TV, radio, PA systems, and more — simultaneously.",
    },
    {
      num: "03",
      title: "Coordinate Response",
      desc: "Real-time dashboards connect rescue teams, hospitals, shelters, and government agencies on one platform.",
    },
    {
      num: "04",
      title: "Recover Faster",
      desc: "Post-disaster dashboards track recovery, resource allocation, and reunification of missing persons.",
    },
  ];

  return (
    <section className="bg-[#F8FAFC] py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-16 items-center">
          <ScrollReveal>
            <Eyebrow variant="blue">Our Solution</Eyebrow>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1B2D] leading-tight mt-4">
              One AI platform connecting prediction, broadcast, and rescue
            </h2>
            <p className="text-[#5B6B84] mt-4 leading-relaxed">
              SafeSphere unifies satellite intelligence, weather APIs, IoT sensors,
              and government networks into a single AI-powered command center — delivering
              verified alerts through 9 redundant channels.
            </p>

            <div className="mt-10 space-y-6">
              {pillars.map((pillar, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-bold flex items-center justify-center shrink-0 text-sm">
                    {pillar.num}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0F1B2D]">{pillar.title}</h4>
                    <p className="text-sm text-[#5B6B84] mt-1">{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="relative rounded-[22px] overflow-hidden h-[500px] bg-[#0B1F3A]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1618477388954-7852f32655cb?auto=format&fit=crop&q=80&w=1000"
                alt="Emergency Command Center"
                className="w-full h-full object-cover rounded-2xl opacity-60"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-[rgba(11,31,58,0.75)] backdrop-blur-[10px] rounded-[14px] p-4 flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-white text-sm font-medium">
                  Real-time coordination across every response agency
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
