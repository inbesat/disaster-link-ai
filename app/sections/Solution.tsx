import Image from "next/image";
import SectionHead from "@/components/ui/SectionHead";
import ScrollReveal from "@/components/ui/ScrollReveal";
import TiltCard from "@/components/landing/ui/TiltCard";

const PILLARS = [
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

export default function Solution() {
  return (
    <section className="bg-secondary py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-16 items-center">
          <ScrollReveal>
            <SectionHead
              eyebrow="Our Solution"
              eyebrowVariant="blue"
              title="One AI platform connecting prediction, broadcast, and rescue"
              subtitle="SafeSphere unifies satellite intelligence, weather APIs, IoT sensors, and government networks into a single AI-powered command center — delivering verified alerts through 9 redundant channels."
              center={false}
              onNavy
            />

            <div className="mt-10 space-y-6">
              {PILLARS.map((pillar, i) => (
                <ScrollReveal key={pillar.num} delay={i * 0.08}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] font-bold flex items-center justify-center shrink-0 text-sm">
                      {pillar.num}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {pillar.title}
                      </h4>
                      <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="relative [perspective:1200px]">
            <TiltCard
              maxTilt={6}
              perspective={1200}
              glare={false}
              className="rounded-[var(--radius-xl2)]"
            >
              <div className="relative rounded-[var(--radius-xl2)] overflow-hidden h-[420px] md:h-[500px] bg-[var(--navy)]">
                <Image
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop"
                  alt="Data analytics dashboard showing real-time disaster metrics, flood risk indicators, and emergency response coordination charts"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                  className="object-cover w-full h-full rounded-2xl opacity-90"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-[rgba(11,31,58,0.75)] backdrop-blur-[10px] rounded-lg p-4 flex items-center gap-3">
                  <div className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-white text-sm font-medium">
                    Real-time coordination across every response agency
                  </span>
                </div>
              </div>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
