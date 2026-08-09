"use client";

import React from "react";

interface EyebrowProps {
  variant?: "blue" | "orange" | "light";
  icon?: React.ReactNode;
  /** Text fallback rendered when `children` is omitted. */
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

const VARIANT_STYLES: Record<string, string> = {
  blue: "bg-[var(--dl-blue)]/10 text-[var(--dl-blue)] border border-[var(--dl-blue)]/15",
  orange:
    "bg-[var(--dl-orange)]/10 text-[var(--dl-orange)] border border-[var(--dl-orange)]/15",
  light: "bg-white/10 text-white/90 border border-white/20 backdrop-blur-sm",
};

export default function Eyebrow({
  variant = "blue",
  icon,
  text,
  children,
  className = "",
}: EyebrowProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${VARIANT_STYLES[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children ?? text}
    </div>
  );
}
