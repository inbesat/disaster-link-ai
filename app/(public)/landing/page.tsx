import Navbar from "@/components/landing/layout/Navbar";
import Footer from "@/components/landing/layout/Footer";
import Hero from "./sections/Hero";
import Problem from "./sections/Problem";
import Solution from "./sections/Solution";
import Features from "./sections/Features";
import Channels from "./sections/Channels";
import CommandCenter from "./sections/CommandCenter";
import HowItWorks from "./sections/HowItWorks";
import Benefits from "./sections/Benefits";
import Accessibility from "./sections/Accessibility";
import Impact from "./sections/Impact";
import TechStack from "./sections/TechStack";
import FAQ from "./sections/FAQ";
import Contact from "./sections/Contact";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "DisasterLink AI — AI-Powered Disaster Management Platform",
  description:
    "Predict disasters before they strike and deliver critical alerts across 9 channels — reaching every citizen, even in the most remote villages.",
};

export default function LandingPage() {
  return (
    <div id="landing-root" className="landing-page">
      <Navbar />
      <Hero />
      <section id="platform">
        <Problem />
        <Solution />
        <Features />
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
    </div>
  );
}
