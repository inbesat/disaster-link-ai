"use client";

import { useEffect, useRef, useState } from "react";

interface CursorSpec {
  name: string;
  color: string;
}

const CURSORS: CursorSpec[] = [
  { name: "Asha (Field)", color: "#0ea5e9" },
  { name: "Control Room", color: "#f59e0b" },
];

interface CursorPos {
  x: number;
  y: number;
}

// Smoothly drift a cursor toward a new random point inside the map area.
function nextTarget(pos: CursorPos, width: number, height: number): CursorPos {
  const jitter = 180;
  const x = Math.max(
    30,
    Math.min(width - 80, pos.x + (Math.random() * 2 - 1) * jitter),
  );
  const y = Math.max(
    30,
    Math.min(height - 60, pos.y + (Math.random() * 2 - 1) * jitter),
  );
  return { x, y };
}

export default function LiveCursors() {
  const [positions, setPositions] = useState<CursorPos[]>([
    { x: 120, y: 90 },
    { x: 300, y: 160 },
  ]);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the container so cursors stay inside the map bounds.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Animate cursors toward random points every 140ms for a "live clicking"
  // feel — they wander the map as if another operator is exploring it.
  useEffect(() => {
    if (size.w === 0 || size.h === 0) return;
    const timer = window.setInterval(() => {
      setPositions((prev) =>
        prev.map((p) => nextTarget(p, size.w, size.h)),
      );
    }, 140);
    return () => window.clearInterval(timer);
  }, [size]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
    >
      {positions.map((pos, i) => {
        const c = CURSORS[i % CURSORS.length];
        return (
          <div
            key={c.name}
            className="absolute transition-all duration-150 ease-out"
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-6px, -6px)",
              willChange: "left, top",
            }}
          >
            {/* SVG mouse cursor */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
            >
              <path
                d="M4 2l16 7-7 1.5L10 17 4 2z"
                fill={c.color}
                stroke="#0A0F1D"
                strokeWidth="1"
              />
            </svg>

            {/* Name tag */}
            <span
              className="ml-4 mt-0.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold text-white"
              style={{ backgroundColor: c.color, boxShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
            >
              {c.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}