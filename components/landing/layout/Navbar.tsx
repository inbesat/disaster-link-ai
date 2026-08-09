'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Menu } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { label: 'Platform', href: '#platform' },
    { label: 'Communication', href: '#communication' },
    { label: 'Command Center', href: '#command-center' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Impact', href: '#impact' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 w-full">
      <div 
        className={`max-w-7xl mx-auto backdrop-blur-[16px] border border-white/10 rounded-full px-5 py-2.5 flex items-center justify-between transition-all duration-300 ${
          scrolled ? 'bg-[rgba(11,31,58,0.85)] shadow-lg' : 'bg-[rgba(11,31,58,0.55)]'
        }`}
      >
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#F97316] flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <span className="text-white font-bold text-lg ml-3">DisasterLink AI</span>
        </div>

        <div className="hidden lg:flex gap-1 items-center">
          {links.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              className="text-sm text-[#C9D6EC] hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex gap-3 items-center">
          <button className="border border-white/20 text-white rounded-full px-5 py-2 text-sm hover:bg-white/10 transition-all">
            Explore Platform
          </button>
          <button className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full px-5 py-2 text-sm font-semibold hover:shadow-lg transition-all">
            Request Demo
          </button>
        </div>

        <button 
          className="lg:hidden text-white p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Menu size={24} />
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden max-w-7xl mx-auto bg-[rgba(11,31,58,0.95)] backdrop-blur-[20px] border border-white/10 rounded-2xl mt-2 p-4 flex flex-col gap-2">
          {links.map((link) => (
            <a 
              key={link.label} 
              href={link.href}
              className="text-sm text-[#C9D6EC] hover:text-white px-4 py-3 rounded-lg hover:bg-white/5 transition-all block"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4 px-2">
            <button className="border border-white/20 text-white rounded-full w-full py-2.5 text-sm hover:bg-white/10 transition-all">
              Explore Platform
            </button>
            <button className="bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white rounded-full w-full py-2.5 text-sm font-semibold hover:shadow-lg transition-all">
              Request Demo
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
