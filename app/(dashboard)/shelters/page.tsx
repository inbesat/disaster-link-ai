import type { Metadata } from "next";
import { getShelters } from "@/app/actions/shelters";
import SheltersTable, { type ShelterRow } from "@/components/dashboard/SheltersTable";
import ConflictResolver from "@/components/dashboard/ConflictResolver";

export const metadata: Metadata = {
  title: "Shelter Management | Disaster Response",
};

export const dynamic = "force-dynamic";

// Demo fallback so the page renders perfectly even before the DB is reachable.
// Mirrors the shape returned by getShelters().
const MOCK_SHELTERS: ShelterRow[] = [
  {
    id: "mock-shelter-1",
    name: "Central Community Hall",
    district: "Patna (Ganga)",
    lat: 25.5941,
    lng: 85.1376,
    capacity: 450,
    currentOccupancy: 312,
    facilities: { water: true, food: true, medical: true, electricity: true },
    status: "open",
    contactPerson: "A. Verma",
    phone: "+91 98000 11122",
    imageUrl: null,
  },
  {
    id: "mock-shelter-2",
    name: "Riverside High School",
    district: "Patna (Ganga)",
    lat: 25.6012,
    lng: 85.1204,
    capacity: 380,
    currentOccupancy: 380,
    facilities: { water: true, food: true, medical: false, electricity: true },
    status: "full",
    contactPerson: "S. Kumari",
    phone: "+91 98000 33344",
    imageUrl: null,
  },
  {
    id: "mock-shelter-3",
    name: "District Hospital Annex",
    district: "Ernakulam (Periyar)",
    lat: 9.9816,
    lng: 76.2999,
    capacity: 300,
    currentOccupancy: 94,
    facilities: { water: true, food: false, medical: true, electricity: true },
    status: "open",
    contactPerson: "M. Nair",
    phone: "+91 98000 55566",
    imageUrl: null,
  },
  {
    id: "mock-shelter-4",
    name: "Civic Center",
    district: "Kamrup (Brahmaputra)",
    lat: 26.3161,
    lng: 91.5984,
    capacity: 520,
    currentOccupancy: 0,
    facilities: { water: true, food: true, medical: false, electricity: true },
    status: "closed",
    contactPerson: null,
    phone: null,
    imageUrl: null,
  },
];

export default async function SheltersPage() {
  let rows: ShelterRow[] = MOCK_SHELTERS;

  try {
    const result = await getShelters();
    rows = result.map((s) => ({
      id: s.id,
      name: s.name,
      district: s.district,
      lat: s.lat,
      lng: s.lng,
      capacity: s.capacity,
      currentOccupancy: s.currentOccupancy,
      facilities: s.facilities as Record<string, boolean> | null,
      status: s.status,
      contactPerson: s.contactPerson,
      phone: s.phone,
      imageUrl: s.imageUrl,
    }));
    if (rows.length === 0) rows = MOCK_SHELTERS;
  } catch {
    // DB unavailable -> fall back to the demo set above.
    rows = MOCK_SHELTERS;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eoc-label text-accent">COMMAND CENTER · PHASE 8</p>
          <h1 className="text-2xl font-bold">Shelter &amp; Infrastructure</h1>
          <p className="mt-1 text-sm text-slate-400">
            Live capacity, occupancy and relief facilities across all districts.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <ConflictResolver />
        </div>
      </header>

      <section className="mt-6">
        <SheltersTable initialShelters={rows} />
      </section>
    </main>
  );
}
