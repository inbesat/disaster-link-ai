'use client'

import SectionHead from '@/components/landing/ui/SectionHead'

export default function Channels() {
  const channels = [
    { emoji: '📻', label: 'FM Radio' },
    { emoji: '📺', label: 'Television' },
    { emoji: '✉️', label: 'SMS' },
    { emoji: '📞', label: 'Voice Calls' },
    { emoji: '💬', label: 'WhatsApp' },
    { emoji: '✈️', label: 'Telegram' },
    { emoji: '🚓', label: 'Police Vehicles' },
    { emoji: '📢', label: 'Panchayat PA' },
    { emoji: '🕌', label: 'Religious PA' }
  ]

  const getPosition = (index: number, total: number) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180)
    // Alternate between ring 1 and ring 2
    const radius = index % 2 === 0 ? 38 : 48 // percentage from center
    const x = 50 + Math.cos(angle) * radius
    const y = 50 + Math.sin(angle) * radius
    return { left: `${x}%`, top: `${y}%` }
  }

  return (
    <section className="bg-gradient-to-b from-[#0B1F3A] to-[#0d2545] py-28 relative overflow-hidden">
      <div 
        className="absolute inset-0 pointer-events-none opacity-30" 
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '34px 34px'
        }}
      />

      <SectionHead
        eyebrow="Last-Mile Communication"
        eyebrowVariant="light"
        title="One alert. Nine channels. Zero citizens missed."
        center={true}
        onNavy={true}
      />

      {/* Mobile Grid View (Hidden on LG) */}
      <div className="lg:hidden max-w-sm mx-auto mt-16 px-6 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          {channels.map((channel, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="bg-white/[0.07] border border-white/[0.16] backdrop-blur-[8px] rounded-[14px] w-[52px] h-[52px] flex items-center justify-center text-[22px] hover:scale-110 hover:bg-white/[0.14] transition-all duration-300">
                {channel.emoji}
              </div>
              <span className="text-[11px] text-white/60 text-center mt-2 leading-tight">
                {channel.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Hub Visualization (Hidden on Mobile) */}
      <div className="hidden lg:block relative mx-auto mt-20 w-full max-w-2xl aspect-square z-10">
        
        {/* Center Circle */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150px] h-[150px] rounded-full bg-gradient-to-br from-[#2563EB] to-[#F97316] flex flex-col items-center justify-center text-center z-10 shadow-xl">
          <span className="text-white text-sm font-bold leading-tight">
            AI Broadcast<br/>Agent
          </span>
          <span className="text-white/70 text-[10px] mt-1 uppercase tracking-wider">
            Multilingual · Redundant
          </span>
        </div>

        {/* Ring 1 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-dashed border-white/15" />
        
        {/* Ring 2 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-dashed border-white/10" />

        {/* Nodes */}
        {channels.map((channel, i) => {
          const pos = getPosition(i, channels.length)
          return (
            <div 
              key={i} 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{ left: pos.left, top: pos.top }}
            >
              <div className="bg-white/[0.07] border border-white/[0.16] backdrop-blur-[8px] rounded-[14px] w-[52px] h-[52px] flex items-center justify-center text-[22px] hover:scale-110 hover:bg-white/[0.14] transition-all duration-300 cursor-default shadow-lg">
                {channel.emoji}
              </div>
              <span className="text-[11px] text-white/60 text-center mt-2 whitespace-nowrap font-medium">
                {channel.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="relative max-w-2xl mx-auto text-center mt-16 px-6 z-10">
        <p className="text-sm text-[#C9D6EC]/80 leading-relaxed">
          Every channel fires in parallel within seconds of an AI-verified alert — with automatic fallback so a warning never depends on a single point of failure.
        </p>
      </div>

    </section>
  )
}
