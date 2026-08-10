"use client";

import React from "react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";

export default function Hero() {
  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, #12335e 0%, #0B1F3A 46%, #081527 100%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, black, transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 items-center py-20 w-full">
        <div>
          <ScrollReveal delay={0}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F97316] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F97316]" />
              </span>
              🛰 AI-Powered Disaster Management Platform
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mt-6 font-[family-name:var(--font-display)]">
              Every Second Saves Lives.
              <br />
              <span className="bg-gradient-to-r from-[#5B8DF6] to-[#F97316] bg-clip-text text-transparent">
                No Citizen Left Unwarned.
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-lg text-[#C9D6EC] mt-6 max-w-xl leading-relaxed">
              DisasterLink AI predicts disasters before they strike and delivers critical
              alerts across 9 communication channels — reaching every citizen, even in the
              most remote villages, within seconds.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap gap-4 mt-8">
              <button className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full px-8 py-3.5 font-semibold text-base hover:shadow-[0_20px_60px_-20px_rgba(37,99,235,0.5)] transition-all">
                Explore Platform →
              </button>
              <button className="border border-white/20 text-white rounded-full px-8 py-3.5 text-base hover:bg-white/10 transition-all">
                Request Demo
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/10 w-full max-w-xl">
              {[
                { value: "50M+", label: "Citizens Protected" },
                { value: "22", label: "States Connected" },
                { value: "9", label: "Alert Channels" },
                { value: "98.4%", label: "Delivery Success" },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${idx > 0 ? "border-l border-white/10 pl-6" : ""}`}
                >
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-xs text-[#C9D6EC] uppercase tracking-wider mt-1">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.3} className="relative">
          <div className="bg-white/[0.06] border border-white/[0.14] backdrop-blur-[18px] rounded-[22px] p-5 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold tracking-widest text-white/70">
                  LIVE NATIONAL FEED
                </span>
              </div>
              <span className="text-[10px] text-white/40">Updated 4s ago</span>
            </div>

            <div className="h-[200px] relative flex items-center justify-center bg-[rgba(37,99,235,0.05)] rounded-xl overflow-hidden">
              <div
                className="absolute w-[160px] h-[160px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"
                style={{ animationDuration: "4s" }}
              />
              <div className="absolute w-[110px] h-[110px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute w-[60px] h-[60px] rounded-full border border-white/10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />

              <div className="absolute w-3 h-3 bg-[#2563EB] rounded-full top-1/4 left-1/3 animate-dotpulse" />
              <div className="absolute w-3 h-3 bg-[#F97316] rounded-full top-2/3 right-1/4 animate-dotpulse" />
              <div className="absolute w-3 h-3 bg-emerald-400 rounded-full bottom-1/4 left-1/2 animate-dotpulse" />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { value: "08", label: "Active Alerts" },
                { value: "286", label: "Rescue Teams" },
                { value: "974", label: "Shelters" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/[0.06] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute top-4 -right-8 lg:-right-16 bg-white/[0.08] border border-white/[0.15] backdrop-blur-[12px] rounded-xl px-4 py-2.5 text-sm text-white z-20 animate-floaty"
            style={{ animationDelay: "0s" }}
          >
            📡 AI Prediction: 96% confidence
          </div>

          <div
            className="absolute -bottom-4 -left-8 lg:-left-16 bg-white/[0.08] border border-white/[0.15] backdrop-blur-[12px] rounded-xl px-4 py-2.5 text-sm text-white z-20 animate-floaty"
            style={{ animationDelay: "2.5s" }}
          >
            ✅ Alert delivered to 12,400 citizens
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
