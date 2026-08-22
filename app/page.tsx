import SupportButton from "@/components/ui/SupportButton";
import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import Hero from "./sections/Hero";
import StatsBar from "./sections/StatsBar";
import FeatureCards from "./sections/FeatureCards";
import DualModePreview from "./sections/DualModePreview";
import Channels from "@/app/(public)/landing/sections/Channels";
import CommandCenter from "@/app/(public)/landing/sections/CommandCenter";
import HowItWorks from "@/app/(public)/landing/sections/HowItWorks";
import Benefits from "@/app/(public)/landing/sections/Benefits";
import Accessibility from "@/app/(public)/landing/sections/Accessibility";
import Impact from "@/app/(public)/landing/sections/Impact";
import TechStack from "@/app/(public)/landing/sections/TechStack";
import FAQ from "@/app/(public)/landing/sections/FAQ";
import Contact from "@/app/(public)/landing/sections/Contact";

export const metadata: Metadata = {
  title: "SafeSphere — AI-Powered Disaster Management Platform",
  description:
    "Predict disasters before they strike and deliver critical alerts across 9 channels — reaching every citizen, even in the most remote villages.",
};

export default function HomePage() {
  return (
    <div
      id="landing-root"
      className="landing-page font-sans"
      data-theme="safesphere"
    >
      <Navbar />
      <Hero />
      <StatsBar />
      <section id="platform">
        <FeatureCards />
      </section>
      <section id="dual-mode">
        <DualModePreview />
      </section>
      <section id="communication">
        <Channels />
      </section>
      <section id="command-center">
        <CommandCenter />
      </section>
      <section id="how-it-works">
        <HowItWorks />
        <Benefits />
      </section>
      <section id="accessibility">
        <Accessibility />
      </section>
      <section id="impact">
        <Impact />
        <TechStack />
      </section>
      <section id="faq">
        <FAQ />
      </section>
      <section id="contact">
        <Contact />
      </section>
      <Footer />
      <SupportButton />
    </div>
  );
}