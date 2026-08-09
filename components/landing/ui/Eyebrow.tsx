'use client';

import React from 'react';

interface EyebrowProps {
  variant?: 'blue' | 'orange' | 'light';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export default function Eyebrow({ variant = 'blue', icon, children }: EyebrowProps) {
  let baseClass = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider";
  
  if (variant === 'blue') {
    baseClass += " bg-[#2563EB]/10 text-[#2563EB]";
  } else if (variant === 'orange') {
    baseClass += " bg-[#F97316]/10 text-[#F97316]";
  } else if (variant === 'light') {
    baseClass += " bg-white/10 text-white/90 border border-white/20";
  }

  return (
    <div className={baseClass}>
      {icon && <span>{icon}</span>}
      {children}
    </div>
  );
}
