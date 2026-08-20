import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/server/prisma";
import { requireRole } from "@/lib/security/require-role";

export const dynamic = "force-dynamic";

const WRITE_ROLES = ["super_admin", "district_admin"] as const;

type CsvRow = {
  name?: string;
  frequency?: string;
  city?: string;
  state?: string;
  call_sign?: string;
  coverage_radius_km?: string;
  lat?: string;
  lng?: string;
  operator?: string;
  type?: string;
  emergency_api_endpoint?: string;
  emergency_contact_phone?: string;
  rds_enabled?: string;
  rds_api_endpoint?: string;
};

/**
 * Bulk-import FM stations from CSV text. Expected headers match the table
 * columns: name, frequency, city, state, call_sign, coverage_radius_km,
 * lat, lng, operator, type, emergency_api_endpoint,
 * emergency_contact_phone, rds_enabled, rds_api_endpoint.
 *
 * Upserts on (name, frequency) — rows that already exist update in place,
 * so re-importing a refreshed spreadsheet is safe.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = await requireRole(WRITE_ROLES);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: { csv?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.csv !== "string" || !body.csv.trim()) {
    return NextResponse.json(
      { ok: false, error: "csv text body is required." },
      { status: 400 },
    );
  }

  const parsed = Papa.parse<CsvRow>(body.csv, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { ok: false, error: `CSV parse error: ${parsed.errors[0].message}` },
      { status: 400 },
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 0; i < parsed.data.length; i += 1) {
    const row = parsed.data[i];
    const index = i;
    const name = row.name?.trim();
    const frequency = row.frequency?.trim();
    const city = row.city?.trim();
    const state = row.state?.trim();

    if (!name || !frequency || !city || !state) {
      skipped += 1;
      errors.push(`Row ${index + 2}: missing name/frequency/city/state`);
      continue;
    }

    const num = (v?: string): number | null => {
      const n = Number(v);
      return v !== undefined && v !== "" && Number.isFinite(n) ? n : null;
    };

    try {
      const existing = await prisma.fmStation.findFirst({
        where: { name, frequency },
      });

      const data = {
        name,
        frequency,
        city,
        state,
        callSign: row.call_sign?.trim() || null,
        coverageRadiusKm: num(row.coverage_radius_km) ?? 50,
        lat: num(row.lat),
        lng: num(row.lng),
        operator: row.operator?.trim() || null,
        type: row.type?.trim() || "private",
        emergencyApiEndpoint: row.emergency_api_endpoint?.trim() || null,
        emergencyContactPhone: row.emergency_contact_phone?.trim() || null,
        rdsEnabled: row.rds_enabled?.trim().toLowerCase() === "true",
        rdsApiEndpoint: row.rds_api_endpoint?.trim() || null,
      };

      if (existing) {
        await prisma.fmStation.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.fmStation.create({ data });
        created += 1;
      }
    } catch (error: unknown) {
      console.error("Failed to import FM station row:", error);
      skipped += 1;
      errors.push(`Row ${index + 2} (${name}): import failed`);
    }
  }

  return NextResponse.json({
    ok: true,
    imported: created,
    updated,
    skipped,
    errors: errors.slice(0, 20),
  });
}
