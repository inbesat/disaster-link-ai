"use client";

import { FileText } from "lucide-react";
import { generateSituationReportHTML, SituationReportData } from "@/lib/reports/situation-report";

export default function SituationReportButton() {
  const handleGenerateReport = () => {
    // Generate mock data for the report
    const mockData: SituationReportData = {
      district: "Patna",
      generatedAt: new Date().toLocaleString(),
      generatedBy: "Command Center Admin",
      floodRiskLevel: "CRITICAL",
      peopleAtRisk: 48210,
      sheltersActive: 15,
      sheltersTotal: 20,
      totalOccupancy: 4500,
      totalCapacity: 6000,
      resourcesDeployed: 1847,
      respondersActive: 863,
      recentAlerts: [
        { severity: "CRITICAL", message: "Water levels rising above danger mark at Gandhi Ghat", time: "10:30 AM" },
        { severity: "WARNING", message: "Heavy rainfall expected in next 24 hours", time: "09:15 AM" },
        { severity: "INFO", message: "NDRF Team 4 arrived at Digha base camp", time: "08:00 AM" }
      ],
      evacuations: [
        { village: "Danapur", shelter: "Patna High School", evacuees: 450, status: "In Progress" },
        { village: "Digha", shelter: "Community Center", evacuees: 300, status: "Completed" },
        { village: "Maner", shelter: "Block Office", evacuees: 1200, status: "Pending" }
      ],
      resources: [
        { category: "Rescue Boats", available: 12, deployed: 76, total: 88 },
        { category: "Food Rations", available: 5000, deployed: 1230, total: 6230 },
        { category: "Medical Kits", available: 300, deployed: 312, total: 612 },
        { category: "Water Pallets", available: 200, deployed: 610, total: 810 }
      ]
    };

    const htmlString = generateSituationReportHTML(mockData);

    // Open in a new window
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlString);
      printWindow.document.close();
      
      // Focus and print after content loads
      printWindow.focus();
      // Wait for any styling to be applied
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <button
      onClick={handleGenerateReport}
      className="flex items-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-muted hover:text-foreground"
    >
      <FileText className="h-4 w-4" />
      SitRep PDF
    </button>
  );
}
