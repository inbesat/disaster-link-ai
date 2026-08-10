import React from "react";

interface DotSepProps {
  className?: string;
}

export default function DotSep({ className = "" }: DotSepProps) {
  return (
    <div
      className={`w-16 h-1 rounded-full bg-gradient-to-r from-[var(--blue)] to-[var(--orange)] mx-auto my-6 ${className}`}
    />
  );
}
