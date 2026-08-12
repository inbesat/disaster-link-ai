import type { Metadata } from "next";
import { getShelters } from "@/app/actions/shelters";
import FieldOccupancyUpdater, {
  type FieldShelter,
} from "@/components/field/FieldOccupancyUpdater";

export const metadata: Metadata = {
  title: "Shelter Check-In · Field Responder | SafeSphere",
};

export const dynamic = "force-dynamic";

// Demo fallback so field responders can demo on-device without a DB.
const MOCK_SHELTERS: FieldShelter[] = [
  {
    id: "mock-shelter-1",
    name: "Central Community Hall",
    district: "Patna (Ganga)",
    capacity: 450,
    currentOccupancy: 312,
  },
  {
    id: "mock-shelter-2",
    name: "Riverside High School",
    district: "Patna (Ganga)",
    capacity: 380,
    currentOccupancy: 380,
  },
  {
    id: "mock-shelter-3",
    name: "District Hospital Annex",
    district: "Ernakulam (Periyar)",
    capacity: 300,
    currentOccupancy: 94,
  },
];

export default async function ShelterUpdatePage() {
  let shelters: FieldShelter[] = MOCK_SHELTERS;

  try {
    const result = await getShelters();
    shelters = result.map((s) => ({
      id: s.id,
      name: s.name,
      district: s.district,
      capacity: s.capacity,
      currentOccupancy: s.currentOccupancy,
    }));
    if (shelters.length === 0) shelters = MOCK_SHELTERS;
  } catch {
    // DB unavailable → fall back to the demo set above.
    shelters = MOCK_SHELTERS;
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      <FieldOccupancyUpdater shelters={shelters} />
    </div>
  );
}
