"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Phase 22 · Step 2 — dark/light theme toggle.
 *
 * Mounted in the Navbar (server component) as a client island. Shows the sun
 * in dark mode (click → light) and the moon in light mode (click → dark).
 * Hydration-safe: renders nothing until the theme is resolved on the client,
 * so the icon never flashes the wrong polarity.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Reserve space so the navbar doesn't shift while hydrating.
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-elevated text-foreground transition hover:border-accent hover:text-accent"
      />
    );
  }

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="group flex h-9 w-9 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-elevated text-foreground transition hover:border-accent hover:text-accent"
    >
      <Sun
        aria-hidden="true"
        className={`h-4 w-4 transition-all duration-300 ${
          isDark
            ? "translate-y-0 rotate-0 opacity-100"
            : "translate-y-4 rotate-90 opacity-0"
        }`}
      />
      <Moon
        aria-hidden="true"
        className={`h-4 w-4 -ml-4 transition-all duration-300 ${
          isDark
            ? "-translate-y-4 -rotate-90 opacity-0"
            : "translate-y-0 rotate-0 opacity-100"
        }`}
      />
    </button>
  );
}

export default ThemeToggle;
