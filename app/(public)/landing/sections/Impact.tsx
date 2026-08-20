"use client";

import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

const stats = [
  { value: "52M+", label: "Citizens Protected" },
  { value: "1,280", label: "Villages Connected" },
  { value: "98%", label: "Alert Delivery Rate" },
  { value: "41 min", label: "Avg Warning Lead Time" },
];

export default function Impact() {
  return (
    <section className="bg-gradient-to-br from-[var(--navy)] to-[#0c2a52] py-28 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10">
        <SectionHead
          eyebrow="Impact"
          eyebrowVariant="light"
          title="Measurable protection, at national scale"
          center={true}
          onNavy={true}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto px-6 mt-16 text-center">
          {stats.map((stat, i) => (
            <ScrollReveal key={i} delay={i * 0.1} animation="fade-up">
              <div>
                <div className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-white to-[#BFD3FF] bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--text-on-navy)] mt-3 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
