"use client";

import { useState } from "react";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";
import {
  BarChart3,
  Shield,
  Radio,
  TrendingUp,
  Bell,
  MapPin,
  Users,
  MessageCircle,
  Navigation,
  ClipboardList,
  Activity,
  Heart,
  Clock,
  Award,
  BookOpen,
} from "lucide-react";

const tabs = [
  { id: "government", label: "Government" },
  { id: "citizens", label: "Citizens" },
  { id: "rescueTeams", label: "Rescue Teams" },
  { id: "volunteers", label: "Volunteers" },
];

const benefitsData = {
  government: [
    {
      icon: BarChart3,
      title: "Real-Time Situational Awareness",
      desc: "Unified dashboard showing all active disasters, deployed resources, and affected populations across your jurisdiction.",
    },
    {
      icon: Shield,
      title: "Automated Compliance Reporting",
      desc: "AI generates NDMA-compliant reports automatically, reducing paperwork and ensuring audit trails.",
    },
    {
      icon: Radio,
      title: "Multi-Channel Broadcast Control",
      desc: "Send verified alerts through all 9 channels from a single interface — with delivery tracking and confirmation.",
    },
    {
      icon: TrendingUp,
      title: "Predictive Resource Planning",
      desc: "AI forecasts resource needs based on disaster models, helping pre-position supplies before events occur.",
    },
  ],
  citizens: [
    {
      icon: Bell,
      title: "Instant Multilingual Alerts",
      desc: "Receive disaster warnings in your language through the channel that works for you — SMS, voice, WhatsApp, or PA systems.",
    },
    {
      icon: MapPin,
      title: "Nearest Shelter Finder",
      desc: "Find the closest safe shelter with real-time capacity, directions, and accessibility information.",
    },
    {
      icon: Users,
      title: "Family Reunification",
      desc: "Register family members and get notified when they check in at shelters or are located by rescue teams.",
    },
    {
      icon: MessageCircle,
      title: "Community Reporting",
      desc: "Report local conditions, road blockages, or emergencies directly to authorities with photos and location.",
    },
  ],
  rescueTeams: [
    {
      icon: Navigation,
      title: "Optimal Routing",
      desc: "AI calculates the fastest safe routes to affected areas, considering road conditions, flooding, and obstacles.",
    },
    {
      icon: Radio,
      title: "Real-Time Coordination",
      desc: "Communicate with all agencies on a unified platform — police, NDRF, hospitals, and district administration.",
    },
    {
      icon: ClipboardList,
      title: "Task Assignment",
      desc: "Receive prioritized task assignments based on team skills, location, and current deployment status.",
    },
    {
      icon: Activity,
      title: "Resource Tracking",
      desc: "Track equipment, vehicles, and supplies in real-time across all deployed teams.",
    },
  ],
  volunteers: [
    {
      icon: Heart,
      title: "Skill-Based Matching",
      desc: "Get matched to tasks that fit your skills — medical aid, logistics, communications, or search and rescue.",
    },
    {
      icon: Clock,
      title: "Flexible Scheduling",
      desc: "Choose shifts and tasks that work with your availability. Real-time updates if situations change.",
    },
    {
      icon: Award,
      title: "Impact Tracking",
      desc: "See the impact of your contributions — citizens helped, supplies delivered, and areas covered.",
    },
    {
      icon: BookOpen,
      title: "Training Resources",
      desc: "Access disaster response training materials and certification programs directly on the platform.",
    },
  ],
};

export default function Benefits() {
  const [activeTab, setActiveTab] = useState<keyof typeof benefitsData>("government");

  return (
    <section id="benefits" className="bg-[#0a0f1a] py-28">
      <SectionHead
        eyebrow="Who It's For"
        eyebrowVariant="blue"
        title="Built for everyone on the front line"
        center={true}
        onNavy={true}
      />

      <div className="flex justify-center gap-2 mt-12 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as keyof typeof benefitsData)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === tab.id
                ? "bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white shadow-lg"
                : "bg-white/5 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-12 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {benefitsData[activeTab].map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <ScrollReveal key={i} animation="fade-up" delay={i * 0.1}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                    <Icon className="text-[#5B8DF6]" size={20} />
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-white">
                      {benefit.title}
                    </h5>
                    <p className="text-sm text-slate-400 mt-1">{benefit.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
