"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  Satellite,
  Megaphone,
  Cpu,
  Workflow,
  TrendingUp,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const NAV_LINKS = [
  { label: "Platform", href: "#platform", icon: Cpu },
  { label: "Communication", href: "#communication", icon: Megaphone },
  { label: "Command Center", href: "#command-center", icon: Satellite },
  { label: "How It Works", href: "#how-it-works", icon: Workflow },
  { label: "Impact", href: "#impact", icon: TrendingUp },
  { label: "FAQ", href: "#faq", icon: HelpCircle },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const reduce = useReducedMotion();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* Track which section is in view for active-link highlighting */
  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.replace("#", ""));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const closeMobile = useCallback(() => setMenuOpen(false), []);

  /* Lock body scroll when the mobile overlay is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <motion.nav
      initial={reduce ? false : { opacity: 0, y: -24 }}
      animate={reduce ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 w-full"
      aria-label="Primary navigation"
    >
      {/* daisyUI semantic navbar — brand theme via data-theme on landing root */}
      <div
        className={`navbar max-w-7xl mx-auto rounded-full px-3 sm:px-5 py-2 backdrop-blur-[16px] border transition-all duration-300 ${
          scrolled
            ? "bg-[rgba(11,31,58,0.85)] border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]"
            : "bg-[rgba(11,31,58,0.55)] border-white/10"
        }`}
      >
        {/* Left: brand */}
        <div className="navbar-start w-auto">
          <a href="#hero" className="flex items-center gap-3 group">
            <span className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#F97316] flex items-center justify-center shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <Shield size={18} className="text-white" aria-hidden="true" />
            </span>
            <span className="hidden sm:block text-white font-bold text-lg tracking-tight font-[family-name:var(--font-display)]">
              DisasterLink{" "}
              <span className="bg-gradient-to-r from-[#5B8DF6] to-[#F97316] bg-clip-text text-transparent">
                AI
              </span>
            </span>
          </a>
        </div>

        {/* Center: desktop links — daisyUI menu bar */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-0.5">
            {NAV_LINKS.map((link) => {
              const active = activeSection === link.href.replace("#", "");
              const Icon = link.icon;
              return (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`rounded-full text-sm font-medium transition-all duration-200 gap-1.5 ${
                      active
                        ? "text-white bg-white/10 shadow-inner"
                        : "text-[#C9D6EC] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: CTAs + mobile toggle */}
        <div className="navbar-end gap-2">
          <a
            href="#platform"
            className="btn btn-ghost hidden md:inline-flex rounded-full border border-white/20 text-white px-5 py-2 text-sm font-medium hover:bg-white/10 hover:border-white/30 transition-all duration-200 normal-case font-sans"
          >
            Explore Platform
          </a>
          <a
            href="#contact"
            className="btn hidden md:inline-flex rounded-full bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white border-0 px-5 py-2 text-sm font-semibold shadow-md hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:brightness-110 transition-all duration-200 normal-case font-sans items-center gap-2"
          >
            Request Demo <ArrowRight size={14} aria-hidden="true" />
          </a>

          <button
            className="btn btn-ghost btn-circle lg:hidden text-white"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={reduce ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? {} : { opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="lg:hidden max-w-7xl mx-auto bg-[rgba(11,31,58,0.95)] backdrop-blur-[20px] border border-white/10 rounded-2xl mt-2 p-4 flex flex-col gap-1"
          >
            <ul className="menu w-full p-0 gap-1">
              {NAV_LINKS.map((link, i) => {
                const Icon = link.icon;
                const active = activeSection === link.href.replace("#", "");
                return (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      initial={reduce ? false : { opacity: 0, x: -10 }}
                      animate={reduce ? {} : { opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                      onClick={closeMobile}
                      className={`flex items-center justify-between text-sm px-4 py-3 rounded-lg transition-all ${
                        active
                          ? "text-white bg-white/10"
                          : "text-[#C9D6EC] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon size={16} aria-hidden="true" />
                        {link.label}
                      </span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </motion.a>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-col gap-3 mt-4 px-2">
              <a
                href="#platform"
                onClick={closeMobile}
                className="border border-white/20 text-white rounded-full w-full py-2.5 text-sm text-center font-medium hover:bg-white/10 transition-all"
              >
                Explore Platform
              </a>
              <a
                href="#contact"
                onClick={closeMobile}
                className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full w-full py-2.5 text-sm text-center font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Request Demo <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}