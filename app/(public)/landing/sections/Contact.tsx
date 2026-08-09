'use client'

import { useState } from 'react'
import ScrollReveal from '@/components/landing/ui/ScrollReveal'
import Eyebrow from '@/components/landing/ui/Eyebrow'
import { Mail, Code, Phone, MapPin } from 'lucide-react'

const contacts = [
  { icon: Mail, color: 'blue', label: 'Email', value: 'disasterlink095@gmail.com', href: 'mailto:disasterlink095@gmail.com' },
  { icon: Code, color: 'orange', label: 'Bug Reports', value: 'anonymous4w08@gmail.com', href: 'mailto:anonymous4w08@gmail.com' },
  { icon: Phone, color: 'green', label: 'Emergency Helpline', value: '+91-9625130964', href: 'tel:+919625130964' },
  { icon: Phone, color: 'green', label: 'Alternate Contact', value: '+91-7251014013', href: 'tel:+917251014013' },
  { icon: MapPin, color: 'blue', label: 'Headquarters', value: 'New Delhi, India', href: null }
]

export default function Contact() {
  const [submitted, setSubmitted] = useState(false)
  
  return (
    <section className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        <ScrollReveal animation="fade-right">
          <div>
            <Eyebrow text="Get In Touch" variant="blue" />
            <h2 className="text-4xl md:text-5xl font-bold text-[#0F1B2D] leading-tight mt-4">
              Request a demo for your district or agency
            </h2>
            <p className="text-[#5B6B84] mt-4 leading-relaxed mb-10">
              Whether you're a government body, rescue organization, or NGO — our team will set up a personalized demo for your region.
            </p>
            
            <div className="space-y-6">
              {contacts.map((contact, i) => {
                const Icon = contact.icon
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      contact.color === 'blue' ? 'bg-[#2563EB]/10' :
                      contact.color === 'orange' ? 'bg-[#F97316]/10' :
                      'bg-emerald-500/10'
                    }`}>
                      <Icon 
                        className={`${
                          contact.color === 'blue' ? 'text-[#2563EB]' :
                          contact.color === 'orange' ? 'text-[#F97316]' :
                          'text-emerald-500'
                        }`} 
                        size={18} 
                      />
                    </div>
                    <div>
                      <h5 className="text-xs text-[#5B6B84] uppercase tracking-wider">{contact.label}</h5>
                      {contact.href ? (
                        <a href={contact.href} className="text-[#0F1B2D] font-medium hover:text-[#2563EB]">
                          {contact.value}
                        </a>
                      ) : (
                        <div className="text-[#0F1B2D] font-medium">{contact.value}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal animation="fade-left" delay={0.2}>
          <div className="bg-white border border-[#E7ECF3] rounded-[20px] p-8 shadow-[0_10px_40px_-12px_rgba(11,31,58,0.18)]">
            {submitted ? (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-[14px] p-5 text-emerald-700 font-medium">
                ✓ Thanks — our team will follow up shortly.
              </div>
            ) : (
              <form 
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                className="space-y-5"
              >
                <div>
                  <label className="text-sm font-medium text-[#0F1B2D] mb-1.5 block">Full Name</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-[12px] border border-[#E7ECF3] bg-[#F8FAFC] text-[#0F1B2D] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#0F1B2D] mb-1.5 block">Organization</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-[12px] border border-[#E7ECF3] bg-[#F8FAFC] text-[#0F1B2D] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#0F1B2D] mb-1.5 block">Email</label>
                  <input type="email" required className="w-full px-4 py-3 rounded-[12px] border border-[#E7ECF3] bg-[#F8FAFC] text-[#0F1B2D] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#0F1B2D] mb-1.5 block">Phone</label>
                  <input type="tel" required className="w-full px-4 py-3 rounded-[12px] border border-[#E7ECF3] bg-[#F8FAFC] text-[#0F1B2D] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all" />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#0F1B2D] mb-1.5 block">Role</label>
                  <select required className="w-full px-4 py-3 rounded-[12px] border border-[#E7ECF3] bg-[#F8FAFC] text-[#0F1B2D] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all appearance-none">
                    <option value=""></option>
                    <option value="Government">Government</option>
                    <option value="Police">Police</option>
                    <option value="NGO">NGO</option>
                    <option value="Citizen">Citizen</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#0F1B2D] mb-1.5 block">Message</label>
                  <textarea rows={4} required className="w-full px-4 py-3 rounded-[12px] border border-[#E7ECF3] bg-[#F8FAFC] text-[#0F1B2D] text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"></textarea>
                </div>
                
                <button type="submit" className="w-full mt-2 bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full py-3.5 font-semibold hover:shadow-[0_20px_60px_-20px_rgba(37,99,235,0.5)] transition-all duration-300">
                  Request Demo →
                </button>
              </form>
            )}
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
