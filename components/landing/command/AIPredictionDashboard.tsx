'use client'

import { useEffect, useRef, useState } from 'react';
import ScrollReveal from '@/components/landing/ui/ScrollReveal';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCountUp } from '@/components/landing/hooks/useCountUp';

const rings = [
  { label: 'Rainfall Risk', value: 72, color: '#2563EB' },
  { label: 'Flood Probability', value: 84, color: '#F97316' },
  { label: 'Cyclone Intensity', value: 46, color: '#EAB308' },
  { label: 'Heatwave Severity', value: 67, color: '#EF4444' }
];

const chartData = [
  { day: 'Mon', risk: 42 },
  { day: 'Tue', risk: 58 },
  { day: 'Wed', risk: 71 },
  { day: 'Thu', risk: 84 },
  { day: 'Fri', risk: 78 },
  { day: 'Sat', risk: 65 },
  { day: 'Sun', risk: 52 }
];

function MetricRing({ label, value, color }: { label: string, value: number, color: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { count } = useCountUp(isVisible ? value : 0, 1400);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    }, { threshold: 0.1 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = isVisible ? circumference * (1 - value / 100) : circumference;

  return (
    <div ref={ref} className="bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-5 flex flex-col items-center relative">
      <div className="relative w-[120px] h-[120px] flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{
              strokeDashoffset,
              transition: 'stroke-dashoffset 1.4s cubic-bezier(0.2, 0.8, 0.2, 1)'
            }}
          />
        </svg>
        <div className="absolute text-2xl font-bold text-white">
          {count}%
        </div>
      </div>
      <div className="text-[13px] text-white/60 mt-3 text-center">{label}</div>
    </div>
  );
}

export default function AIPredictionDashboard() {
  return (
    <ScrollReveal>
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {rings.map((ring, i) => (
            <MetricRing key={i} {...ring} />
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4">
            <div className="text-[12px] text-white/50 uppercase tracking-wider mb-2">Earthquake Activity</div>
            <div className="bg-white/10 rounded-full h-2 w-full">
              <div className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] h-2 rounded-full" style={{ width: '18%' }} />
            </div>
          </div>
          
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4">
            <div className="text-[12px] text-white/50 uppercase tracking-wider mb-2">Avg Response Time</div>
            <div className="text-xl font-bold text-emerald-400">3 Sec</div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4">
            <div className="text-[12px] text-white/50 uppercase tracking-wider mb-2">Satellite Updates</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-lg font-bold text-white">Live</div>
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/[0.08] rounded-[14px] p-4">
            <div className="text-[12px] text-white/50 uppercase tracking-wider mb-2">AI Prediction Confidence</div>
            <div className="text-xl font-bold text-[#F97316]">96%</div>
          </div>
        </div>

        <div className="mt-4 bg-white/[0.04] border border-white/[0.08] rounded-[16px] p-6">
          <div className="text-white font-semibold mb-4">Flood Risk Trend — 7 Day Forecast</div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'rgba(255,255,255,0.4)', fontSize:12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'rgba(255,255,255,0.4)', fontSize:12}} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(11,31,58,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#F97316' }}
                />
                <Area type="monotone" dataKey="risk" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ScrollReveal>
  );
}
