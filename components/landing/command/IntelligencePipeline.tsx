'use client'

import ScrollReveal from '@/components/landing/ui/ScrollReveal';

const nodes = [
  { text: '🛰 Satellite Images + IoT Sensors' },
  { text: '⛅ Weather APIs' },
  { text: '🤖 AI Prediction Engine' },
  { text: '📊 Risk Analysis' },
  { text: '🖥 Government Dashboard' },
  { text: '✉️ SMS & App Alerts' },
  { text: '🚓 Police, NDRF, Hospitals & Rescue Teams' },
  { text: '🧑‍🤝‍🧑 Citizens Receive Safety Instructions', highlight: true }
];

export default function IntelligencePipeline() {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[20px] p-6 flex flex-col h-full">
      <style>{`
        @keyframes flowdown {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
      
      <div className="text-lg font-bold text-white mb-6">🔄 Intelligence Pipeline</div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-[380px] mx-auto w-full">
        {nodes.map((node, i) => (
          <div key={i} className="w-full">
            <ScrollReveal delay={i * 0.1}>
              <div 
                className={`rounded-[14px] px-5 py-3 text-center relative border ${
                  node.highlight 
                    ? 'border-[#F97316]/30 bg-[#F97316]/[0.08]' 
                    : 'bg-white/[0.06] border-white/[0.1]'
                }`}
              >
                <div className="text-sm text-white/80">{node.text}</div>
              </div>
            </ScrollReveal>
            
            {i < nodes.length - 1 && (
              <div className="relative h-10 flex items-center justify-center w-full my-0.5">
                <div className="w-[2px] h-full bg-gradient-to-b from-white/20 to-white/10" />
                <div 
                  className="absolute w-1.5 h-1.5 rounded-full bg-[#5B8DF6]"
                  style={{ 
                    animation: 'flowdown 1.8s linear infinite',
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
