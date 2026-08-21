"use client";

import SectionHead from "@/components/landing/ui/SectionHead";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import { Star, Quote, Building2, Shield, Users } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Priya Sharma",
    role: "District Collector, Bihar",
    org: "Darbhanga District Administration",
    avatar: "PS",
    avatarColor: "from-[var(--accent-primary)] to-[var(--brand-blue-light)]",
    quote:
      "SafeSphere transformed how we handle flood emergencies. During the 2025 monsoon season, we reached 2.3 million citizens within 12 minutes of alert issuance — compared to 4+ hours with our previous system.",
    rating: 5,
    metric: "12 min",
    metricLabel: "Alert Delivery",
    icon: Shield,
  },
  {
    name: "Rajesh Kumar",
    role: "Chief Engineer, NDRF",
    org: "National Disaster Response Force",
    avatar: "RK",
    avatarColor: "from-[var(--accent-warning)] to-[var(--accent-danger)]",
    quote:
      "The AI prediction engine flagged a flash flood 6 hours before it hit. We pre-positioned 4 rescue teams and evacuated 1,200 people from low-lying areas. Zero casualties in our zone.",
    rating: 5,
    metric: "6 hrs",
    metricLabel: "Early Warning",
    icon: Building2,
  },
  {
    name: "Ananya Reddy",
    role: "Volunteer Coordinator",
    org: "SEEDS India NGO",
    avatar: "AR",
    avatarColor: "from-[var(--accent-success)] to-emerald-400",
    quote:
      "The field mode is a game-changer. Our volunteers receive real-time checklists, shelter data, and team locations — even without internet. It makes coordination effortless during chaos.",
    rating: 5,
    metric: "340+",
    metricLabel: "Volunteers Active",
    icon: Users,
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[var(--bg-primary)] py-28">
      <ScrollReveal>
        <SectionHead
          eyebrow="Testimonials"
          eyebrowVariant="orange"
          title="Trusted by emergency responders"
          subtitle="See how districts and organizations across India are using SafeSphere to protect their communities"
          center={true}
          onNavy={true}
        />
      </ScrollReveal>

      <div className="max-w-7xl mx-auto px-6 mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((t, i) => (
          <ScrollReveal key={i} delay={i * 0.15} animation="fade-up">
            <div className="relative h-full bg-white/5 border border-slate-800 rounded-[var(--radius-xl6)] p-8 backdrop-blur-sm shadow-[var(--shadow-card)] hover:border-slate-700 transition-colors">
              {/* Quote icon */}
              <Quote
                className="absolute top-6 right-6 h-8 w-8 text-slate-800/60"
                aria-hidden
              />

              {/* Rating stars */}
              <div className="flex gap-1 mb-4" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star
                    key={s}
                    className="h-4 w-4 fill-[var(--accent-warning)] text-[var(--accent-warning)]"
                    aria-hidden
                  />
                ))}
              </div>

              {/* Quote text */}
              <blockquote className="text-[var(--text-secondary)] leading-relaxed mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Metric badge */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-white/5 rounded-lg border border-slate-800/50">
                <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <t.icon className="h-5 w-5 text-[var(--accent-primary)]" aria-hidden />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{t.metric}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t.metricLabel}</p>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avatarColor} flex items-center justify-center text-white text-sm font-bold`}
                  aria-hidden
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                  <p className="text-xs text-[var(--accent-primary)]">{t.org}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
