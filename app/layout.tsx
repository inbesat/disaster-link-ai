import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import ToastViewport from "@/components/ui/Toast";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import SimulationToggle from "@/components/admin/SimulationToggle";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { MapSettingsProvider } from "@/lib/settings/MapSettingsContext";
import { SIMULATION_COOKIE } from "@/lib/admin/simulation";
import "./globals.css";

// Phase 22 · Step 9 + UI Phase 1 · Step 9 — next/font/google (Inter for the
// UI, JetBrains Mono for technical data readouts — coordinates, timestamps,
// quotas). Exposed as --font-sans / --font-mono so tailwind.config.ts and
// globals.css pick them up. Fonts are self-hosted at build time (no runtime
// Google requests) and next/font applies fallback metric overrides, so text
// never shifts while fonts load (zero CLS). `display: swap` is implied.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Disaster Response Intelligence Platform",
  description:
    "Flood prediction, emergency planning, and resource allocation for the Bharat Shakti Hackathon.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const simulationActive = cookies().get(SIMULATION_COOKIE)?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      {/* bg-primary / text-primary = the roadmap tokens (globals.css also
          sets them on body — these classes make it explicit). */}
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} bg-primary text-primary antialiased`}
      >
        {simulationActive && (
          <div
            role="alert"
            className="relative z-50 flex h-9 items-center justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,#facc15_0_28px,#111111_28px_56px)]"
          >
            <span className="animate-pulse font-bold tracking-widest text-black drop-shadow">
              ⚠️ TRAINING SIMULATION MODE ACTIVE - NO REAL ALERTS WILL BE SENT ⚠️
            </span>
          </div>
        )}

        <div className="fixed bottom-4 right-4 z-50">
          <SimulationToggle active={simulationActive} />
        </div>

        <ThemeProvider>
          <LanguageProvider>
            <MapSettingsProvider>
              {children}
              <EmergencyContactCard />
            </MapSettingsProvider>
          </LanguageProvider>
        </ThemeProvider>
        <ToastViewport />
      </body>
    </html>
  );
}
