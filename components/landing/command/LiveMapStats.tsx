'use client'

import { useCountUp } from '@/components/landing/hooks/useCountUp';

const markers = [
  { emoji: '🔴', label: 'Flood — Bihar', top: '35%', left: '65%', color: 'rgba(239,68,68,0.4)' },
  { emoji: '🟠', label: 'Cyclone — Odisha Coast', top: '55%', left: '62%', color: 'rgba(249,115,22,0.4)' },
  { emoji: '🟡', label: 'Earthquake — Himachal', top: '18%', left: '38%', color: 'rgba(250,204,21,0.4)' },
  { emoji: '🟢', label: 'Safe Shelter — Nagpur', top: '48%', left: '48%', color: 'rgba(16,185,129,0.4)' },
  { emoji: '🚑', label: 'Rescue Team — Gujarat', top: '45%', left: '28%', color: 'rgba(59,130,246,0.4)' },
  { emoji: '🏥', label: 'Relief Camp — Kolkata', top: '42%', left: '72%', color: 'rgba(168,85,247,0.4)' },
  { emoji: '🟠', label: 'Cyclone Watch — Andhra', top: '62%', left: '52%', color: 'rgba(249,115,22,0.4)' },
  { emoji: '🟢', label: 'Safe Shelter — Assam', top: '30%', left: '78%', color: 'rgba(16,185,129,0.4)' },
];

const stats = [
  { icon: '🚨', label: 'Active Disasters', value: 8, bg: 'bg-red-500/15' },
  { icon: '📣', label: 'Citizens Alerted', value: 124550, bg: 'bg-blue-500/15' },
  { icon: '🚑', label: 'Rescue Teams Deployed', value: 286, bg: 'bg-emerald-500/15' },
  { icon: '🏠', label: 'Safe Shelters', value: 974, bg: 'bg-amber-500/15' },
  { icon: '🤖', label: 'AI Alerts Generated Today', value: 3482, bg: 'bg-purple-500/15' },
];

function StatCard({ stat }: { stat: typeof stats[0] }) {
  const { ref, count } = useCountUp(stat.value);

  return (
    <div className="bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-4 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${stat.bg}`}>
        {stat.icon}
      </div>
      <div>
        <div className="text-[13px] text-white/60">{stat.label}</div>
        <div className="text-2xl font-bold text-white" ref={ref}>
          {count.toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
}

export default function LiveMapStats() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
      <style>{`
        @keyframes mpulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      
      {/* Map Panel */}
      <div className="bg-white/[0.04] border border-white/10 rounded-[20px] p-6 min-h-[520px] shadow-[0_0_0_1px_rgba(37,99,235,0.25),0_20px_60px_-20px_rgba(37,99,235,0.45)]">
        <div className="flex justify-between items-center mb-6">
          <div className="text-white font-semibold">🗺️ India — Live Alert Map</div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Flood
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-orange-400"></span> Cyclone
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-yellow-400"></span> Earthquake
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Shelter
            </div>
          </div>
        </div>

        <div className="relative h-[400px] w-full bg-gradient-to-b from-[#0d2545] to-[#081428] rounded-xl overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 450 420" className="w-full h-full">
            <path
              d="M200,50 L230,45 L250,60 L280,55 L300,70 L320,90 L310,120 L330,150 L340,180 L320,220 L310,260 L280,300 L260,330 L240,350 L220,370 L200,380 L180,370 L160,350 L140,300 L130,260 L120,220 L130,180 L140,150 L150,120 L160,90 L170,70 L190,55 Z"
              fill="rgba(37,99,235,0.08)"
              stroke="rgba(37,99,235,0.3)"
              strokeWidth="1"
            />
          </svg>

          {markers.map((marker, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center group cursor-default"
              style={{ top: marker.top, left: marker.left }}
            >
              <div
                className="absolute w-8 h-8 rounded-full z-0"
                style={{
                  backgroundColor: marker.color,
                  animation: 'mpulse 2.2s ease-out infinite'
                }}
              />
              <span className="text-lg relative z-10">{marker.emoji}</span>
              <div className="absolute -top-8 bg-[rgba(11,31,58,0.9)] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                {marker.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Panel */}
      <div className="space-y-4">
        {stats.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>
    </div>
  );
}
