'use client'

import ScrollReveal from '@/components/landing/ui/ScrollReveal'
import SectionHead from '@/components/landing/ui/SectionHead'
import { Brain, Globe, Satellite, Cloud, Cpu, Server, Smartphone, Radio } from 'lucide-react'

const techs = [
  { icon: Brain, title: 'AI / Machine Learning' },
  { icon: Globe, title: 'GIS Mapping' },
  { icon: Satellite, title: 'Satellite Data' },
  { icon: Cloud, title: 'Weather APIs' },
  { icon: Cpu, title: 'IoT Sensor Networks' },
  { icon: Server, title: 'Cloud Infrastructure' },
  { icon: Smartphone, title: 'Mobile Application' },
  { icon: Radio, title: 'SMS & Broadcast Gateway' }
]

export default function TechStack() {
  return (
    <section className="bg-white py-28">
      <SectionHead eyebrow="Technology" eyebrowVariant="blue" title="Powered by a modern, resilient stack" center={true} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto px-6 mt-16">
        {techs.map((tech, i) => {
          const Icon = tech.icon
          return (
            <ScrollReveal key={i} delay={i * 0.05} animation="fade-up">
              <div className="bg-white border border-[#E7ECF3] rounded-[16px] p-6 text-center hover:-translate-y-1.5 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.25),0_20px_60px_-20px_rgba(249,115,22,0.45)] transition-all duration-300">
                <div className="w-14 h-14 rounded-[14px] bg-[rgba(11,31,58,0.06)] flex items-center justify-center mx-auto mb-4">
                  <Icon className="text-[#0B1F3A]" size={24} />
                </div>
                <h3 className="text-sm font-semibold text-[#0F1B2D]">{tech.title}</h3>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </section>
  )
}
