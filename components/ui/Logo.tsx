import { type SVGProps } from "react";

// ---------------------------------------------------------------------
// components/ui/Logo.tsx — SafeSphere brand mark.
//
// Four-quadrant shield: fire (top-left), rain (top-right), wave
// (bottom-left), wind (bottom-right) — the natural calamities the platform
// watches — with a citizen silhouetted in the center, the person SafeSphere
// is built to protect. Pure SVG, so it stays crisp at any size (favicon to
// 4K hero) and needs no raster asset. Server-safe (no "use client") so it
// can render in server layouts, navbars and sidebars alike.
// ---------------------------------------------------------------------

export function Logo({ className = "h-8 w-8", ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
      {...rest}
    >
      <defs>
        <linearGradient id="fire-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="rain-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
        <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <linearGradient id="wind-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <clipPath id="shield-clip">
          <path d="M256 32C256 32 448 64 448 192C448 352 256 480 256 480C256 480 64 352 64 192C64 64 256 32 256 32Z" />
        </clipPath>
      </defs>

      {/* Shield Background / Quadrants */}
      <g clipPath="url(#shield-clip)">
        {/* Top Left: Fire */}
        <rect x="0" y="0" width="256" height="256" fill="url(#fire-grad)" />
        {/* Top Right: Rain */}
        <rect x="256" y="0" width="256" height="256" fill="url(#rain-grad)" />
        {/* Bottom Left: Wave */}
        <rect x="0" y="256" width="256" height="256" fill="url(#wave-grad)" />
        {/* Bottom Right: Wind */}
        <rect x="256" y="256" width="256" height="256" fill="url(#wind-grad)" />

        {/* Abstract Elements inside quadrants */}
        <path d="M128 100 Q160 140 128 180 Q96 140 128 100" fill="#fff" opacity="0.6" />
        <circle cx="384" cy="120" r="20" fill="#fff" opacity="0.6" />
        <circle cx="350" cy="150" r="10" fill="#fff" opacity="0.6" />
        <circle cx="410" cy="150" r="10" fill="#fff" opacity="0.6" />
        <path d="M64 384 Q128 320 192 384" stroke="#fff" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
        <path d="M320 320 L448 320 M340 360 L428 360 M360 400 L408 400" stroke="#fff" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* Inner Divider Cross */}
      <line x1="256" y1="32" x2="256" y2="480" stroke="#0f172a" strokeWidth="12" />
      <line x1="64" y1="256" x2="448" y2="256" stroke="#0f172a" strokeWidth="12" />

      {/* Thick Outer Shield Border */}
      <path
        d="M256 32C256 32 448 64 448 192C448 352 256 480 256 480C256 480 64 352 64 192C64 64 256 32 256 32Z"
        fill="none"
        stroke="#f8fafc"
        strokeWidth="24"
        strokeLinejoin="round"
      />

      {/* Center User Circle */}
      <circle cx="256" cy="256" r="80" fill="#0f172a" stroke="#f8fafc" strokeWidth="12" />

      {/* User Icon */}
      <circle cx="256" cy="225" r="24" fill="#f8fafc" />
      <path d="M196 305 C196 270 316 270 316 305 Z" fill="#f8fafc" />
    </svg>
  );
}

export default Logo;