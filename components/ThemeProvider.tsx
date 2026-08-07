"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Phase 22 · Step 2 — theme provider.
 *
 * next-themes manages the `dark` class on <html> (no FOUC — it applies the
 * stored/default theme in a blocking inline script before paint). The app is
 * dark-first ("Emergency Operations Center" identity), so `defaultTheme` is
 * dark; toggling switches to the light "day ops" palette defined in
 * globals.css under `:root:not(.dark)`.
 *
 * `enableSystem={false}` keeps the demo deterministic — no surprise OS-theme
 * flips mid-demo.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

export default ThemeProvider;
