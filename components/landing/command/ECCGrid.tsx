'use client'

import ScrollReveal from '@/components/landing/ui/ScrollReveal';
import { useCountUp } from '@/components/landing/hooks/useCountUp';

const cards = [
  { emoji: '🚨', title: 'Active Incidents', badge: 'warn', badgeText: '⚠ Warning', desc: 'Multi-state flood and cyclone events', value: '8', isNumber: true },
  { emoji: '🏥', title: 'Nearby Hospitals', badge: 'live', badgeText: '● Live', desc: 'Connected healthcare facilities', value: '142', isNumber: true },
  { emoji: '🚑', title: 'Rescue Team Locations', badge: 'live', badgeText: '● Live', desc: 'Teams deployed across affected zones', value: '286', isNumber: true },
  { emoji: '🏠', title: 'Safe Shelters', badge: 'live', badgeText: '● Live', desc: 'Open and receiving evacuees', value: '974', isNumber: true },
  { emoji: '🌧', title: 'Weather Radar', badge: 'live', badgeText: '● Live', desc: 'Real-time meteorological data feed', value: 'Active', isNumber: false },
  { emoji: '📞', title: 'Emergency Hotline Status', badge: 'live', badgeText: '● Live', desc: 'All helpline numbers operational', value: '100%', isNumber: false }
];

function CardValue({ value, isNumber }: { value: string, isNumber: boolean }) {
  const numericValue = isNumber ? parseInt(value) : 0;
  const { ref, count } = useCountUp(numericValue, 1500);

  if (!isNumber) {
    return <div className="text-2xl font-bold text-white mt-2">{value}</div>;
  }

  return (
    <div className="text-2xl font-bold text-white mt-2" ref={ref}>
      {count.toLocaleString('en-IN')}
    </div>
  );
}

export default function ECCGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <ScrollReveal key={i} delay={i * 0.1}>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-5 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{card.emoji}</span>
                <span className="text-white font-semibold text-sm">{card.title}</span>
              </div>
              <div className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                card.badge === 'warn' 
                  ? 'bg-amber-500/15 text-amber-400' 
                  : 'bg-emerald-500/15 text-emerald-400'
              }`}>
                {card.badgeText}
              </div>
            </div>
            <div className="text-[13px] text-white/50">{card.desc}</div>
            <CardValue value={card.value} isNumber={card.isNumber} />
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
