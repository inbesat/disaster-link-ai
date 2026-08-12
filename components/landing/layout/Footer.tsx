"use client";

import {
  Phone,
  Mail,
  Code,
  MapPin,
  AtSign,
  Camera,
  Briefcase,
} from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#0B1F3A] pt-[70px] pb-[26px]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Logo className="h-9 w-9" />
              <span className="text-white font-bold text-lg">SafeSphere</span>
            </div>
            <p className="text-sm text-[#C9D6EC]/70 leading-relaxed mb-6">
              AI-powered disaster management and last-mile emergency communication — built
              for governments, rescue teams, and citizens.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white/60 hover:bg-[#2563EB] hover:text-white hover:-translate-y-[3px] transition-all duration-300"
              >
                <AtSign size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white/60 hover:bg-[#2563EB] hover:text-white hover:-translate-y-[3px] transition-all duration-300"
              >
                <Camera size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white/60 hover:bg-[#2563EB] hover:text-white hover:-translate-y-[3px] transition-all duration-300"
              >
                <Briefcase size={18} />
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-5">
              Platform
            </h4>
            <div className="space-y-3 flex flex-col">
              <a
                href="#features"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                AI Features
              </a>
              <a
                href="#communication"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                Communication
              </a>
              <a
                href="#command-center"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                Command Center
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                How It Works
              </a>
              <a
                href="#impact"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                Impact
              </a>
            </div>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-5">
              Resources
            </h4>
            <div className="space-y-3 flex flex-col">
              <a
                href="#"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                API Documentation
              </a>
              <a
                href="#"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                Integration Guide
              </a>
              <a
                href="#"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                NDMA Guidelines
              </a>
              <a
                href="#"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                State SOPs
              </a>
              <a
                href="#"
                className="text-sm text-[#C9D6EC]/70 hover:text-white transition-colors cursor-pointer w-fit"
              >
                Open Data
              </a>
            </div>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-5">
              Contact
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-white/40" />
                <span className="text-sm text-[#C9D6EC]/70">
                  +91-9625130964 (Emergency)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-white/40" />
                <span className="text-sm text-[#C9D6EC]/70">
                  +91-7251014013 (Support)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-white/40" />
                <span className="text-sm text-[#C9D6EC]/70">
                  safesphere095@gmail.com
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Code size={14} className="text-white/40" />
                <span className="text-sm text-[#C9D6EC]/70">
                  anonymous4w08@gmail.com (Bug Reports)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-white/40" />
                <span className="text-sm text-[#C9D6EC]/70">New Delhi, India</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#C9D6EC]/40">
          <div>
            © 2026 SafeSphere. Built for Smart India Hackathon. All data shown is
            simulated for demonstration.
          </div>
          <div>Designed for public safety, accessibility & trust.</div>
        </div>
      </div>
    </footer>
  );
}
