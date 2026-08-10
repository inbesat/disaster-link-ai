"use client";

import React from "react";
import Eyebrow from "./Eyebrow";
import DotSep from "./DotSep";

interface SectionHeadProps {
  eyebrowVariant?: "blue" | "orange" | "light";
  eyebrowIcon?: React.ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
  onNavy?: boolean;
  /** Show gradient dot separator below subtitle. */
  showDot?: boolean;
}

export default function SectionHead({
  eyebrowVariant = "blue",
  eyebrowIcon,
  eyebrow,
  title,
  subtitle,
  center = true,
  onNavy = false,
  showDot = false,
}: SectionHeadProps) {
  return (
    <div
      className={`flex flex-col ${
        center ? "items-center text-center" : "items-start text-left"
      } max-w-3xl ${center ? "mx-auto" : ""}`}
    >
      {eyebrow && (
        <Eyebrow variant={eyebrowVariant} icon={eyebrowIcon}>
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={`mt-6 text-4xl md:text-5xl font-bold leading-tight font-[family-name:var(--font-display)] ${
          onNavy ? "text-white" : "text-[var(--text-dark)]"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-lg leading-relaxed ${
            onNavy ? "text-[var(--text-on-navy)]" : "text-[var(--text-muted)]"
          }`}
        >
          {subtitle}
        </p>
      )}
      {showDot && <DotSep />}
    </div>
  );
}
