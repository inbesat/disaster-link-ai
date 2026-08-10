"use client";

import SectionHead from "@/components/landing/ui/SectionHead";
import LiveMapStats from "@/components/landing/command/LiveMapStats";
import AIPredictionDashboard from "@/components/landing/command/AIPredictionDashboard";
import AIDecisionEngine from "@/components/landing/command/AIDecisionEngine";
import EmergencyTimeline from "@/components/landing/command/EmergencyTimeline";
import IntelligencePipeline from "@/components/landing/command/IntelligencePipeline";
import ECCGrid from "@/components/landing/command/ECCGrid";

export default function CommandCenter() {
  return (
    <section className="bg-[#081428] py-28 relative overflow-hidden">
      {/* Subtle dot grid overlay */}
      <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/[0.06] border border-white/10 rounded-full px-5 py-2 text-[11px] font-semibold tracking-widest text-white/60 uppercase">
            🛰 LIVE OPERATIONS PREVIEW · DEMO DATA
          </div>
        </div>

        <SectionHead
          onNavy={true}
          center={true}
          title="Inside the DisasterLink AI Command Center"
          subtitle="Real-time detection, prediction, and response coordination — all in one unified intelligence platform."
        />

        <div className="space-y-16 mt-16">
          {/* 1. Live Disaster Map */}
          <div>
            <div className="mb-6 flex flex-col gap-1">
              <h3 className="text-white font-semibold text-xl">
                Live Disaster Map
              </h3>
              <p className="text-[#9FB4D6] text-sm">
                Monitor disasters, rescue operations, and emergency resources across
                India in real time.
              </p>
            </div>
            <LiveMapStats />
          </div>

          {/* 2. AI Prediction Dashboard */}
          <AIPredictionDashboard />

          {/* 3. AI Recommendation Engine */}
          <AIDecisionEngine />

          {/* 4. Emergency Timeline */}
          <div>
            <div className="mb-6 flex flex-col gap-1 text-center">
              <h3 className="text-white font-semibold text-xl">
                Emergency Timeline
              </h3>
              <p className="text-[#9FB4D6] text-sm">
                From first signal to boots on the ground — in under six minutes.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <EmergencyTimeline />
              <IntelligencePipeline />
            </div>
          </div>

          {/* 5. Emergency Command Center */}
          <div>
            <div className="mb-6 flex flex-col gap-1 text-center">
              <h3 className="text-white font-semibold text-xl">
                Emergency Command Center
              </h3>
              <p className="text-[#9FB4D6] text-sm">
                One screen for incidents, hospitals, rescue teams, shelters, weather,
                and hotline status.
              </p>
            </div>
            <ECCGrid />
          </div>
        </div>
      </div>
    </section>
  );
}
