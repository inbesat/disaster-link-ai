import { AlarmClock, LayoutGrid, Timer, AlertTriangle } from "lucide-react";
import SectionHead from "@/components/ui/SectionHead";
import ScrollReveal from "@/components/ui/ScrollReveal";

const PROBLEMS = [
  {
    icon: AlarmClock,
    title: "Last-Mile Blackout",
    desc: "Over 40% of rural villages receive disaster warnings too late — or not at all. Traditional broadcast systems fail where connectivity is weakest.",
  },
  {
    icon: LayoutGrid,
    title: "Fragmented Systems",
    desc: "State, district, and central agencies operate on disconnected platforms. Critical data sits in silos while response teams wait for coordination.",
  },
  {
    icon: Timer,
    title: "Delayed Response",
    desc: "Manual coordination between agencies adds hours to response times. In flood scenarios, every 30 minutes of delay puts thousands more at risk.",
  },
  {
    icon: AlertTriangle,
    title: "Misinformation Spread",
    desc: "During emergencies, unverified rumors spread faster than official alerts. Citizens make dangerous decisions based on false information.",
  },
];

export default function Problem() {
  return (
    <section className="bg-[#0a0f1a] py-28">
      <SectionHead
        eyebrow="The Problem"
        eyebrowVariant="orange"
        title="Disaster warnings still don't reach the people who need them most"
        subtitle="India's disaster management infrastructure remains fragmented — critical alerts are delayed, duplicated, or never delivered to the citizens who need them."
        center
        onNavy
      />

      <div className="max-w-7xl mx-auto px-6 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROBLEMS.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 0.08} className="h-full">
              <div className="bg-white/5 border border-slate-800 rounded-[18px] p-7 hover:-translate-y-1.5 hover:border-slate-700 hover:bg-white/[0.07] transition-all duration-300 h-full">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-[var(--orange)]/10 text-[var(--orange)] flex items-center justify-center mb-5">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}