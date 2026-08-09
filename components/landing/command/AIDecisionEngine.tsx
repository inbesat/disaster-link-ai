'use client'

import ScrollReveal from '@/components/landing/ui/ScrollReveal';
import { CheckCircle } from 'lucide-react';

const decisions = [
  'Send flood warning to district control room',
  'Notify district administration & SDRF',
  'Deploy 15 rescue teams to flood zone',
  'Open 4 relief camps in nearby blocks',
  'Alert nearby hospitals to prepare capacity',
  'Send SMS alerts to affected citizens'
];

export default function AIDecisionEngine() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 shadow-[0_0_0_1px_rgba(249,115,22,0.25),0_20px_60px_-20px_rgba(249,115,22,0.45)]">
      <style>{`
        @keyframes orbpulse {
          0% { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); }
          70% { box-shadow: 0 0 0 15px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0 rgba(249,115,22,0); }
        }
      `}</style>
      
      <div className="flex items-center gap-4 mb-6">
        <div 
          className="w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#2563EB] to-[#F97316] flex items-center justify-center text-2xl relative shrink-0"
          style={{ animation: 'orbpulse 2.4s ease-in-out infinite' }}
        >
          🤖
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">AI Recommendation Engine</h3>
          <p className="text-[13px] text-white/50">Automated response plan for Flood Alert #FL-2291</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {decisions.map((decision, i) => (
          <ScrollReveal key={i} delay={i * 0.1}>
            <div className="flex items-start gap-3 bg-white/[0.03] rounded-[14px] p-4 h-full">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle size={14} className="text-emerald-400" />
              </div>
              <div className="text-sm text-white/80">{decision}</div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
