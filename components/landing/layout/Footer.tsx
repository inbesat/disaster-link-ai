"use client";

import React from "react";
import { Phone, Mail, ExternalLink } from "lucide-react";
import Logo from "@/components/ui/Logo";

// ---------------------------------------------------------------------
// components/landing/layout/Footer.tsx — Phase 2 · Prompt 2.5
//
// Comprehensive 4-column dark footer:
//   - Column 1: Logo + tagline + description
//   - Column 2: Platform links (Features, Demo, Roadmap, API)
//   - Column 3: Resources links (Documentation, Open Source, NDMA, Contact)
//   - Column 4: Contact Us with phone + email
//   - Social icons (GitHub, Twitter, LinkedIn)
//   - Bottom bar: copyright + hackathon attribution
// ---------------------------------------------------------------------

const PLATFORM_LINKS = [
  { label: "Features", href: "#feature-cards" },
  { label: "Demo", href: "#demo" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "API", href: "#api" },
];

const RESOURCE_LINKS = [
  { label: "Help Center", href: "/help" },
  { label: "Documentation", href: "#docs" },
  { label: "Open Source", href: "#opensource" },
  { label: "NDMA Guidelines", href: "#ndma" },
  { label: "Contact", href: "#contact" },
];

const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/disasterlink",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "Twitter",
    href: "https://twitter.com/disasterlink",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/disasterlink",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0f1a] pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          {/* Column 1 — Brand */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <Logo className="h-9 w-9" />
              <span className="text-white font-bold text-lg">
                DisasterLink AI
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              AI-powered disaster management and last-mile emergency
              communication — built for governments, rescue teams, and citizens.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.12] flex items-center justify-center text-white/60 hover:bg-[#2563eb] hover:text-white hover:-translate-y-[3px] transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-5">
              Platform
            </h4>
            <div className="space-y-3 flex flex-col">
              {PLATFORM_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-slate-400 hover:text-white transition-colors w-fit"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3 — Resources */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-5">
              Resources
            </h4>
            <div className="space-y-3 flex flex-col">
              {RESOURCE_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-slate-400 hover:text-white transition-colors w-fit"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 4 — Contact Us */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/40 mb-5">
              Contact Us
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-white/40 mt-0.5" />
                <div>
                  <span className="text-sm text-slate-400 block">
                    +91-9625130964
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={14} className="text-white/40 mt-0.5" />
                <div>
                  <span className="text-sm text-slate-400 block">
                    +91-7251014013
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-white/40 mt-0.5" />
                <div>
                  <span className="text-sm text-slate-400 block">
                    safesphere095@gmail.com
                  </span>
                  <span className="text-xs text-slate-500">(General)</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Mail size={14} className="text-white/40 mt-0.5" />
                <div>
                  <span className="text-sm text-slate-400 block">
                    anonymous4w08@gmail.com
                  </span>
                  <span className="text-xs text-slate-500">(Bug Reports)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-14 mb-6" />

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>
            © 2026 DisasterLink AI. Built for Bharat Shakti Hackathon.
          </div>
          <div className="flex items-center gap-1">
            Made for public safety, accessibility & trust.
          </div>
        </div>
      </div>
    </footer>
  );
}
