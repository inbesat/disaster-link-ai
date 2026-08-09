"use client";

import React, { useState } from "react";
import {
  Users,
  Building2,
  Shield,
  HeartHandshake,
  BarChart3,
  Bell,
  Map,
  Radio,
  Siren,
  Truck,
  HandHelping,
  Globe,
  Megaphone,
  ClipboardCheck,
  MapPin,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "@/components/landing/ui/ScrollReveal";
import SectionHead from "@/components/landing/ui/SectionHead";

/* ------------------------------------------------------------------ */
/*  Tab data                                                           */
/* ------------------------------------------------------------------ */
type BenefitItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

type TabData = {
  key: string;
  label: string;
  tabIcon: React.ReactNode;
  items: BenefitItem[];
};

const TABS: TabData[] = [
  {
    key: "government",
    label: "Government",
    tabIcon: <Building2 size={16} />,
    items: [
      {
        icon: <BarChart3 size={20} />,
        title: "Unified Command Dashboard",
        description:
          "One screen for all disaster data — alerts, resources, teams, shelters — across every district and agency.",
      },
      {
        icon: <Bell size={20} />,
        title: "Automated Alert Dispatch",
        description:
          "AI composes, translates, and fires alerts across 9 channels in seconds — no manual drafting or approval delays.",
      },
      {
        icon: <Map size={20} />,
        title: "Real-Time Situational Awareness",
        description:
          "Live maps showing flood zones, evacuation routes, team locations, and shelter capacity across the state.",
      },
      {
        icon: <ClipboardCheck size={20} />,
        title: "Compliance & Audit Trails",
        description:
          "Every alert, decision, and resource movement is logged with timestamps for NDMA/SDMA compliance reporting.",
      },
    ],
  },
  {
    key: "citizens",
    label: "Citizens",
    tabIcon: <Users size={16} />,
    items: [
      {
        icon: <Megaphone size={20} />,
        title: "Multilingual Life-Safety Alerts",
        description:
          "Receive warnings in your language via SMS, WhatsApp, voice call, or app push — even without internet.",
      },
      {
        icon: <MapPin size={20} />,
        title: "Nearest Shelter Finder",
        description:
          "Real-time shelter locations with capacity, accessibility info, and turn-by-turn navigation.",
      },
      {
        icon: <Radio size={20} />,
        title: "Ground Truth Reporting",
        description:
          "Submit geo-tagged photos, voice notes, and reports from the ground to help responders prioritize.",
      },
      {
        icon: <UserCheck size={20} />,
        title: "Family Reunification",
        description:
          "Register and search for family members across shelters, hospitals, and relief camps in real time.",
      },
    ],
  },
  {
    key: "rescue",
    label: "Rescue Teams",
    tabIcon: <Shield size={16} />,
    items: [
      {
        icon: <Siren size={20} />,
        title: "AI-Prioritized Dispatch",
        description:
          "Automated triage assigns teams to incidents based on severity, proximity, and available resources.",
      },
      {
        icon: <Map size={20} />,
        title: "Dynamic Route Optimization",
        description:
          "Real-time routing that adapts to road closures, flood levels, and bridge status to reach victims faster.",
      },
      {
        icon: <Truck size={20} />,
        title: "Resource Pre-Positioning",
        description:
          "AI predicts what supplies are needed before demand spikes — boats, medicine, food pre-staged at staging areas.",
      },
      {
        icon: <Globe size={20} />,
        title: "Cross-Agency Coordination",
        description:
          "NDRF, SDRF, police, fire, and NGOs share one live map — no more radio confusion or duplicate deployments.",
      },
    ],
  },
  {
    key: "volunteers",
    label: "Volunteers",
    tabIcon: <HeartHandshake size={16} />,
    items: [
      {
        icon: <HandHelping size={20} />,
        title: "Skill-Based Matching",
        description:
          "Auto-matched to nearby incidents based on your skills, training level, and real-time demand.",
      },
      {
        icon: <MapPin size={20} />,
        title: "Safe Zone Guidance",
        description:
          "Real-time safety perimeter updates ensure you help without putting yourself at risk.",
      },
      {
        icon: <ClipboardCheck size={20} />,
        title: "Task Assignments",
        description:
          "Clear, prioritized tasks — distribute relief, manage crowds, assist evacuations — all tracked digitally.",
      },
      {
        icon: <UserCheck size={20} />,
        title: "Impact Recognition",
        description:
          "Your contributions are logged and verified — build a digital service record recognized by authorities.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Benefits() {
  const [activeTab, setActiveTab] = useState("government");
  const activeData = TABS.find((t) => t.key === activeTab)!;

  return (
    <section id="benefits" className="relative bg-[#F8FAFC] py-28">
      <div className="max-w-7xl mx-auto px-6">
        <ScrollReveal>
          <SectionHead
            eyebrowVariant="blue"
            eyebrowIcon={<Users size={14} />}
            eyebrow="Who It's For"
            title="Built for everyone on the front line"
            subtitle="From district collectors to village volunteers — every stakeholder gets purpose-built tools that work under pressure."
            onNavy={false}
            center
          />
        </ScrollReveal>

        {/* Tab navigation */}
        <ScrollReveal delay={0.1}>
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-gradient-to-r from-[#2563EB] to-[#5B8DF6] text-white shadow-[0_4px_16px_-4px_rgba(37,99,235,0.4)]"
                    : "bg-white border border-[#E7ECF3] text-[#5B6B84] hover:border-[#2563EB]/30 hover:text-[#2563EB]"
                }`}
              >
                {tab.tabIcon}
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Tab panel */}
        <div className="mt-10 min-h-[320px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {activeData.items.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="flex items-start gap-4 bg-white border border-[#E7ECF3] rounded-[16px] p-6 hover:-translate-y-1 hover:shadow-[0_10px_40px_-12px_rgba(11,31,58,0.12)] transition-all duration-300"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.06,
                    ease: [0.2, 0.7, 0.2, 1],
                  }}
                >
                  {/* Icon circle */}
                  <div className="w-11 h-11 rounded-full bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[#0F1B2D] mb-1">
                      {item.title}
                    </h5>
                    <p className="text-[13px] leading-relaxed text-[#5B6B84]">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
