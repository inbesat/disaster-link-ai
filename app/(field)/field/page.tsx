import type { Metadata } from "next";
import Link from "next/link";
import {
  Home,
  PackageSearch,
  MapPin,
  Siren,
  Phone,
} from "lucide-react";
import OfflineBanner from "@/components/field/OfflineBanner";
import AssignmentList from "@/components/field/AssignmentList";
import GpsCheckIn from "@/components/field/GpsCheckIn";
import DamageReporterModal from "@/components/field/DamageReporterModal";
import VoiceNoteReporter from "@/components/field/VoiceNoteReporter";
import EmergencyRecallBanner from "@/components/field/EmergencyRecallBanner";
import RecallTestButton from "@/components/field/RecallTestButton";
import TaskDispatchButton from "@/components/field/TaskDispatchButton";

export const metadata: Metadata = {
  title: "Field Responder | DRIP",
};

const QUICK_ACTIONS = [
  {
    href: "/shelter-update",
    label: "Update Shelter",
    detail: "Report occupancy",
    icon: Home,
  },
  {
    href: "/request-resources",
    label: "Request Resources",
    detail: "Boats, food, meds",
    icon: PackageSearch,
  },
  {
    href: "/report",
    label: "Report Hazard",
    detail: "Flood / blocked road",
    icon: Siren,
  },
  {
    href: "/field/map",
    label: "Deployment Map",
    detail: "View live zones",
    icon: MapPin,
  },
];

export default function FieldHomePage() {
  return (
    <div className="space-y-6">
      <OfflineBanner />

      <EmergencyRecallBanner />

      {/* Greeting */}
      <section className="rounded-xl border-2 border-cyan-400/30 bg-[#0d1526] p-5">
        <p className="text-2xl font-bold text-amber-300">On duty</p>
        <p className="mt-1 text-lg text-gray-200">
          Your district is on <span className="font-bold text-red-400">AMBER WATCH</span>.
          Shelter occupancy and resource requests need your live updates.
        </p>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-lg font-bold uppercase tracking-wider text-cyan-300">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {QUICK_ACTIONS.map(({ href, label, detail, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-[72px] items-center gap-4 rounded-xl border-2 border-[#1c2740] bg-[#0d1526] px-5 py-4 transition hover:border-amber-400 hover:bg-[#111a2e]"
            >
              <Icon className="h-7 w-7 shrink-0 text-amber-300" />
              <span className="leading-tight">
                <span className="block text-lg font-bold text-gray-100">{label}</span>
                <span className="block text-base text-gray-400">{detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Voice-to-text field notes */}
      <VoiceNoteReporter />

      {/* GPS Check-In */}
      <GpsCheckIn />

      {/* Rapid Photo Inspection */}
      <DamageReporterModal />

      {/* My Assignments */}
      <AssignmentList />

      {/* Emergency line */}
      <section className="flex flex-col gap-3 rounded-xl border-2 border-red-400/40 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Phone className="h-6 w-6 text-red-400" />
          <span className="text-lg font-bold text-red-300">District Control Room</span>
        </div>
        <a
          href="tel:+911123456789"
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border-2 border-red-400 bg-red-500/15 px-6 text-lg font-bold text-red-300 transition hover:bg-red-500/25"
        >
          CALL NOW
        </a>
      </section>

      {/* Simulation: command-room dispatch demos (recall + critical task) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <RecallTestButton />
        <TaskDispatchButton />
      </div>
    </div>
  );
}