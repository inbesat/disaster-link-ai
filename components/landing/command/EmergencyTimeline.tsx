'use client'

import ScrollReveal from '@/components/landing/ui/ScrollReveal';
import { useEffect, useState } from 'react';

const steps = [
  { time: '10:00 AM', emoji: '🛰', desc: 'Satellite detects heavy rainfall pattern over Bihar region' },
  { time: '10:02 AM', emoji: '🤖', desc: 'AI predicts 84% flood probability — recommends Level 3 alert' },
  { time: '10:03 AM', emoji: '🏛', desc: 'District authorities notified via secure government dashboard' },
  { time: '10:04 AM', emoji: '📱', desc: 'Citizens receive multilingual alerts via SMS, WhatsApp, and voice calls' },
  { time: '10:06 AM', emoji: '🚑', desc: 'Rescue teams dispatched to high-risk zones with optimal routing' }
];

export default function EmergencyTimeline() {
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6">
      <div className="text-lg font-bold text-white mb-6">⏱️ Emergency Response Timeline</div>

      <div className="relative before:absolute before:left-[23px] before:top-0 before:bottom-0 before:w-[2px] before:bg-gradient-to-b before:from-[#2563EB] before:to-[#F97316]">
        <div className="space-y-8">
          {steps.map((step, i) => (
            <ScrollReveal 
              key={i} 
              delay={i * 0.15}
              onReveal={() => setRevealed(prev => ({ ...prev, [i]: true }))}
            >
              <div className="flex items-start gap-5 relative">
                <div 
                  className={`w-[46px] h-[46px] shrink-0 rounded-full border-2 border-[#F97316]/30 bg-[#081428] flex items-center justify-center text-lg z-10 transition-shadow duration-500 ${
                    revealed[i] ? 'shadow-[0_0_12px_rgba(249,115,22,0.4)]' : ''
                  }`}
                >
                  {step.emoji}
                </div>
                <div className="pt-1">
                  <div className="text-[#F97316] text-sm font-semibold">{step.time}</div>
                  <div className="text-white/80 text-sm mt-1">{step.desc}</div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
