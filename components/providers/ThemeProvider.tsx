// ---------------------------------------------------------------------
// components/providers/ThemeProvider.tsx
// UI/UX Phase 1 · Step 10 — Dark Mode Theme Provider.
//
// Wraps next-themes for the whole app. Dark-first by construction:
//   • attribute="class"          → toggles the `dark` class on <html> —
//     what tailwind darkMode:"class" and globals.css :root:not(.dark) read
//   • defaultTheme="dark"        → the Emergency Ops palette is the default
//   • enableSystem={false}       → never follows the OS theme (deterministic
//     demos — no surprise light flip mid-presentation on a projector)
//   • disableTransitionOnChange  → next-themes strips color transitions while
//     swapping, so the theme flip is instant (no washed-out flash)
//
// Toggle policy (decision recorded — light stays reachable): the app always
// STARTS dark; the ThemeToggle in the navbar/landing can still switch to the
// light "day ops" palette under :root:not(.dark) in globals.css.
//
// INSTALL (only if starting fresh): npm install next-themes
// Already installed here — package.json: "next-themes": "^0.4.6"
// ---------------------------------------------------------------------

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Dark-first theme provider. Must wrap any component that calls
 * `useTheme()` — in this app that's everything inside the root layout's
 * children tree (and the ThemeToggle islands).
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
