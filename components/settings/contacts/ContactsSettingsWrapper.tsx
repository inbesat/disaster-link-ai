"use client";

// ---------------------------------------------------------------------
// components/settings/contacts/ContactsSettingsWrapper.tsx — Contacts (Phase 7).
//
// Emergency Contacts & Communication page (dark emergency-ops theme).
// Hosts all six Phase 7 cards in a responsive grid:
//   • Personal Contacts      (Step 2)  — full width
//   • Control Room           (Step 3)  — full width
//   • Quick Dial             (Step 4)  — half width
//   • SOS Message Templates  (Step 5)  — half width
//   • Live GPS Injection     (Step 6)  — full width
//   • Signal Failover        (Step 7)  — full width
//   • Emergency Mode Trigger (Step 8)  — persistent banner pinned on top
//   • Contact Health Check   (Step 9)  — full width
// ---------------------------------------------------------------------

import { PhoneCall } from "lucide-react";
import { ContactSettingsProvider } from "@/lib/contacts-settings-mock";
import EmergencyModeTrigger from "./EmergencyModeTrigger";
import PersonalContactsCard from "./PersonalContactsCard";
import ControlRoomCard from "./ControlRoomCard";
import QuickDialCard from "./QuickDialCard";
import MessageTemplatesCard from "./MessageTemplatesCard";
import AutoShareLocationCard from "./AutoShareLocationCard";
import ChannelPriorityCard from "./ChannelPriorityCard";
import ContactVerificationCard from "./ContactVerificationCard";

export default function ContactsSettingsWrapper() {
  return (
    <ContactSettingsProvider>
      <ContactsPageContent />
    </ContactSettingsProvider>
  );
}

function ContactsPageContent() {
  return (
    <div className="space-y-10" data-settings-scope="contacts">
      {/* Global Emergency Mode trigger — Step 8 (always on top) */}
      <EmergencyModeTrigger />

      {/* Page header */}
      <header>
        <p className="eoc-label flex items-center gap-2 text-cyan-300/90">
          <PhoneCall className="h-3.5 w-3.5" aria-hidden />
          SETTINGS / EMERGENCY CONTACTS &amp; COMMS
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Emergency Contacts &amp; Comms
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Configure critical speed-dials, SOS fallbacks, and emergency message
          templates.
        </p>
      </header>

      {/* Cards grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Contacts — Step 2 */}
        <div className="lg:col-span-2">
          <PersonalContactsCard />
        </div>

        {/* Control Room — Step 3 */}
        <div className="lg:col-span-2">
          <ControlRoomCard />
        </div>

        {/* Quick Dial — Step 4 */}
        <QuickDialCard />

        {/* Templates — Step 5 */}
        <MessageTemplatesCard />

        {/* Live GPS Injection — Step 6 */}
        <div className="lg:col-span-2">
          <AutoShareLocationCard />
        </div>

        {/* Signal Failover — Step 7 */}
        <div className="lg:col-span-2">
          <ChannelPriorityCard />
        </div>

        {/* Contact Health Check — Step 9 */}
        <div className="lg:col-span-2">
          <ContactVerificationCard />
        </div>
      </div>
    </div>
  );
}
