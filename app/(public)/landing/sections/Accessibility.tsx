'use client'

import ScrollReveal from '@/components/landing/ui/ScrollReveal'
import Eyebrow from '@/components/landing/ui/Eyebrow'
import { Volume2, Type, WifiOff, Speaker } from 'lucide-react'

const languages = ['हिंदी', 'বাংলা', 'தமிழ்', 'తెలుగు', 'मराठी', 'ગુજરાતી', 'ಕನ್ನಡ', 'മലയാളം', 'ਪੰਜਾਬੀ', 'ଓଡ଼ିଆ', 'অসমীয়া', 'English']

const features = [
  { icon: Volume2, title: 'Voice & IVR Alerts', desc: 'Automated voice calls and IVR menus deliver critical information to citizens without smartphones or internet access.' },
  { icon: Type, title: 'Large-Text & Screen Reader Mode', desc: 'Full accessibility compliance with adjustable text sizes, high-contrast modes, and screen reader optimization.' },
  { icon: WifiOff, title: 'Offline-First Sync', desc: 'Critical alert data cached locally — citizens see the latest warnings even when connectivity drops.' },
  { icon: Speaker, title: 'Village PA Network Integration', desc: 'Alerts automatically broadcast through panchayat and religious institution public address systems.' }
]

export default function Accessibility() {
  return (
    <section className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        <ScrollReveal animation="fade-right">
          <div>
            <Eyebrow text="♿ Accessibility" variant="orange" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1B2D] leading-tight mt-4">
              Built for every citizen, every device, every connection
            </h2>
            <p className="text-[#5B6B84] mt-4 leading-relaxed">
              DisasterLink AI ensures no citizen is excluded from life-saving information — regardless of language, ability, device, or connectivity.
            </p>
            
            <div className="flex flex-wrap gap-2 mt-8">
              {languages.map((lang, i) => (
                <span 
                  key={i} 
                  className="bg-white border border-[#E7ECF3] rounded-full px-4 py-2 text-sm font-semibold text-[#0B1F3A] hover:border-[#F97316] hover:bg-[#F97316]/5 transition-all duration-200"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-left" delay={0.2}>
          <div className="space-y-4">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="flex items-start gap-4 bg-[#F8FAFC] border border-[#E7ECF3] rounded-[16px] p-5">
                  <div className="w-11 h-11 rounded-xl bg-[#F97316]/10 flex items-center justify-center shrink-0">
                    <Icon className="text-[#F97316]" size={20} />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-[#0F1B2D]">{feature.title}</h5>
                    <p className="text-sm text-[#5B6B84] mt-1">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
