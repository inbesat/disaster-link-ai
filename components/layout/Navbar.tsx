"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Communication", href: "#communication" },
  { label: "Command Center", href: "#command-center" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Impact", href: "#impact" },
  { label: "FAQ", href: "#faq" },
];

const fadeDown: Variants = {
  hidden: { opacity: 0, y: -14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] },
  },
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const reduceMotion = useReducedMotion();

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

  const entrance = reduceMotion ? undefined : fadeDown;

  return (
    <motion.nav
      initial="hidden"
      animate="show"
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3 w-full"
    >
      <motion.div
        variants={entrance}
        className="max-w-7xl mx-auto backdrop-blur-[16px] border border-white/10 rounded-full px-5 py-2.5 flex items-center justify-between transition-all duration-300"
        style={{
          backgroundColor: scrolled ? "rgba(11, 31, 58, 0.85)" : "rgba(11, 31, 58, 0.55)",
          boxShadow: scrolled
            ? "0 8px 32px -8px rgba(0, 0, 0, 0.5)"
            : "0 0 0 0 transparent",
        }}
      >
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#F97316] flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-105">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            DisasterLink AI
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex gap-1 items-center">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === link.href.replace("#", "")
                  ? "text-white bg-white/10"
                  : "text-[#C9D6EC] hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex gap-3 items-center">
          <a
            href="#platform"
            className="border border-white/20 text-white rounded-full px-5 py-2 text-sm font-medium hover:bg-white/10 hover:border-white/30 transition-all duration-200"
          >
            Explore Platform
          </a>
          <a
            href="#contact"
            className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full px-5 py-2 text-sm font-semibold shadow-md hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-200 flex items-center gap-2"
          >
            Request Demo
            <ArrowRight size={14} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="lg:hidden max-w-7xl mx-auto bg-[rgba(11,31,58,0.95)] backdrop-blur-[20px] border border-white/10 rounded-2xl mt-2 p-4 flex flex-col gap-1"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className={`text-sm px-4 py-3 rounded-lg transition-all block ${
                  activeSection === link.href.replace("#", "")
                    ? "text-white bg-white/10"
                    : "text-[#C9D6EC] hover:text-white hover:bg-white/5"
                }`}
                onClick={closeMobile}
              >
                {link.label}
              </motion.a>
            ))}
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
                Request Demo
                <ArrowRight size={14} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
