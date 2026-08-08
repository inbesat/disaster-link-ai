import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { Toaster } from "react-hot-toast";
import EmergencyContactCard from "@/components/EmergencyContactCard";
import SimulationToggle from "@/components/admin/SimulationToggle";
import ThemeProvider from "@/components/ThemeProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { SIMULATION_COOKIE } from "@/lib/admin/simulation";
import "./globals.css";

// Phase 22 · Step 9 — next/font/google (Inter for the UI, Roboto Mono for
// the technical readouts). Fonts are self-hosted at build time (no runtime
// Google requests) and next/font applies fallback metric overrides, so text
// never shifts while fonts load (zero CLS). `display: swap` is implied.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
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
  const simulationActive =
    cookies().get(SIMULATION_COOKIE)?.value === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
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
            {children}
            <EmergencyContactCard />
          </LanguageProvider>
        </ThemeProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--surface-elevated)",
              color: "var(--foreground)",
              border: "1px solid var(--border)",
            },
          }}
        />
      </body>
    </html>
  );
}