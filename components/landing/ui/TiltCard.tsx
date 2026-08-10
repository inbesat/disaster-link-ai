"use client";

import React, { useRef, useState } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
  /** Max rotation in degrees. Default 10. */
  maxTilt?: number;
  /** Perspective for the 3D transform. Default 1000. */
  perspective?: number;
  /** Elevation under cursor, simulates depth. */
  glare?: boolean;
};

/**
 * TiltCard — a reusable mouse-driven 3D tilt surface. Rotates toward the
 * cursor on rotateX/rotateY with spring smoothing, optional glare sheen,
 * and honours `prefers-reduced-motion`.
 */
export default function TiltCard({
  children,
  className = "",
  maxTilt = 10,
  perspective = 1000,
  glare = true,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const rotateX = useSpring(tilt.x, { stiffness: 220, damping: 22, mass: 0.6 });
  const rotateY = useSpring(tilt.y, { stiffness: 220, damping: 22, mass: 0.6 });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (py - 0.5) * -2 * maxTilt, y: (px - 0.5) * 2 * maxTilt });
    setGlarePos({ x: px * 100, y: py * 100, opacity: 1 });
  };

  const onPointerLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlarePos((g) => ({ ...g, opacity: 0 }));
  };

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div style={{ perspective }} className="w-full h-full">
      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative will-change-transform ${className}`}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden z-20"
            style={{ opacity: glarePos.opacity }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at " +
                  glarePos.x +
                  "% " +
                  glarePos.y +
                  "%, rgba(255,255,255,0.12) 0%, transparent 55%)",
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}