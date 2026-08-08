"use client";

import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) supabase = createClient();
  return supabase;
}

/**
 * GDPR data-subject export (Phase 21 · Step 7).
 *
 * Per Art. 20 GDPR / §17 DPDP Act (India), a data subject may request a
 * portable, machine-readable copy of their personal data. This button
 * compiles a structured export payload (profile + login history +
 * recent actions), streams it as JSON, and triggers a browser download.
 *
 * In the demo the payload is seeded with realistic mock data (auth may be
 * bypassed); when a real Supabase session exists, the account's actual
 * email/name are used. A production build would pull history rows from the
 * database and sign the archive with an HMAC.
 */

interface ExportAction {
  action: string;
  timestamp: string;
}

export interface PersonalDataExport {
  schemaVersion: string;
  exportTimestamp: string;
  legalBasis: string;
  portability: {
    format: "application/json";
    encoding: "utf-8";
  };
  profile: {
    displayName: string;
    email: string;
    organization: string;
    role: string;
    assignedDistrict: string;
    /** Phone redacted at export by design — see docs/SECURITY_COMPLIANCE.md */
    phone: string;
  };
  loginHistory: { timestamp: string; ip: string }[];
  /** AI planner conversations (redacted excerpts). */
  chatLogs: { timestamp: string; topic: string; excerpt: string }[];
  /** GPS check-ins (rounded to neighbourhood precision). */
  gpsHistory: { timestamp: string; lat: number; lng: number; label: string }[];
  recentActions: ExportAction[];
  retentionPolicy: string;
}

function isoHoursAgo(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 3_600_000).toISOString();
}

export function buildExportPayload(email: string | null, displayName: string | null): PersonalDataExport {
  return {
    schemaVersion: "1.0.0",
    exportTimestamp: new Date().toISOString(),
    legalBasis:
      "Article 20 GDPR — Right to data portability · §17 Digital Personal Data Protection Act 2023 (India)",
    portability: { format: "application/json", encoding: "utf-8" },
    profile: {
      displayName: displayName ?? "Asha Verma (mock profile)",
      email: email ?? "asha.verma@ndrf.example",
      organization: "NDRF",
      role: "field_responder",
      assignedDistrict: "Patna",
      phone: "[REDACTED]",
    },
    loginHistory: [
      { timestamp: isoHoursAgo(2), ip: "203.0.113.24" },
      { timestamp: isoHoursAgo(26), ip: "203.0.113.24" },
      { timestamp: isoHoursAgo(50), ip: "203.0.113.9" },
      { timestamp: isoHoursAgo(74), ip: "198.51.100.41" },
      { timestamp: isoHoursAgo(98), ip: "198.51.100.41" },
    ],
    chatLogs: [
      {
        timestamp: isoHoursAgo(6),
        topic: "Evacuation plan — Patna north",
        excerpt: "[redacted] … recommended 3 shelters with 1,250 open beds …",
      },
      {
        timestamp: isoHoursAgo(30),
        topic: "Resource allocation — boats",
        excerpt: "[redacted] … 12 boats assigned to Sampatchak …",
      },
    ],
    gpsHistory: [
      { timestamp: isoHoursAgo(4), lat: 25.6111, lng: 85.1442, label: "Gandhi Maidan Shelter (rounded)" },
      { timestamp: isoHoursAgo(28), lat: 25.5951, lng: 85.1625, label: "Kankarbagh Checkpoint (rounded)" },
      { timestamp: isoHoursAgo(52), lat: 25.6222, lng: 85.1353, label: "Danapur Depot (rounded)" },
    ],
    recentActions: [
      {
        action: "Acknowledged critical flood alert #AL-2214 (Ganga — Patna)",
        timestamp: isoHoursAgo(3),
      },
      {
        action: "Updated shelter occupancy — Gandhi Maidan Shelter (342/500)",
        timestamp: isoHoursAgo(9),
      },
      {
        action: "Submitted damage report #DR-0098 (Kankarbagh, waterlogging)",
        timestamp: isoHoursAgo(31),
      },
    ],
    retentionPolicy:
      "Records retained for 12 months then anonymized. See docs/SECURITY_COMPLIANCE.md §5.",
  };
}

export default function DataExportButton() {
  async function handleExport() {
    let email: string | null = null;
    let displayName: string | null = null;

    // Best-effort: enrich with the real session when auth is available.
    // Any failure falls back to the mock payload — the demo never breaks.
    try {
      const { data } = await getSupabase().auth.getUser();
      email = data.user?.email ?? null;
      displayName = data.user?.user_metadata?.name ?? null;
    } catch {
      // auth unavailable — use mock profile
    }

    const payload = buildExportPayload(email, displayName);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "personal_data_export.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("Data export compiled securely.");
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent hover:bg-accent/10 hover:text-accent active:scale-[0.98]"
    >
      <span aria-hidden>📥</span>
      Download My Data (GDPR)
    </button>
  );
}
