import type { Metadata } from "next";
import { cookies } from "next/headers";
import CommandCenterClient from "@/components/command-center/CommandCenterClient";
import DataHealthWidget from "@/components/dashboard/DataHealthWidget";
import AlertSimulator from "@/components/dashboard/AlertSimulator";
import ShelterCapacityWidget from "@/components/dashboard/ShelterCapacityWidget";
import LowStockWidget from "@/components/dashboard/LowStockWidget";
import KPICards from "@/components/dashboard/KPICards";
import CommandCenterCharts from "@/components/dashboard/CommandCenterCharts";
import GapAnalysisTable from "@/components/dashboard/GapAnalysisTable";
import DisasterTimeline from "@/components/dashboard/DisasterTimeline";
import SitRepGenerator from "@/components/dashboard/SitRepGenerator";
import FieldTasksPlaceholder from "@/components/dashboard/FieldTasksPlaceholder";
import LiveActivityFeed from "@/components/dashboard/LiveActivityFeed";
import BroadcastMessage from "@/components/dashboard/BroadcastMessage";

export const metadata: Metadata = {
  title: "Command Center | Disaster Response",
};

export default function CommandCenterPage() {
  // Demo role resolution: the earliest guest-mode cookie demos the field
  // responder view; otherwise default to district_admin (full analytics).
  const isGuest = cookies().get("guest_mode")?.value === "true";
  const role = isGuest ? "field_responder" : "district_admin";
  const isFieldResponder = role === "field_responder";

  return (
    <CommandCenterClient
      top={
        <div className="px-4 pb-4 pt-4">
          <KPICards />
        </div>
      }
      sidebar={
        isFieldResponder ? (
          <>
            <LiveActivityFeed />
            <FieldTasksPlaceholder />
            <SitRepGenerator />
            <AlertSimulator />
          </>
        ) : (
          <>
            <LiveActivityFeed />
            <BroadcastMessage />
            <DataHealthWidget />
            <ShelterCapacityWidget />
            <LowStockWidget />
            <GapAnalysisTable />
            <CommandCenterCharts />
            <DisasterTimeline />
            <SitRepGenerator />
            <AlertSimulator />
          </>
        )
      }
    />
  );
}
