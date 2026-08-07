"use server";

export type AssignmentStatus = "Not Started" | "En Route" | "Completed";
export type TaskPriority = "CRITICAL" | "HIGH" | "ROUTINE";

export interface FieldAssignment {
  id: string;
  title: string;
  priority: TaskPriority;
  location: string;
  lat: number;
  lng: number;
  instruction: string;
  status: AssignmentStatus;
}

// Mock responder assignments for the Patna demo district. Stands in for a
// `field_tasks` table until a real one is provisioned.
const MOCK_TASKS: FieldAssignment[] = [
  {
    id: "t1",
    title: "Inspect Kankarbagh Pump Station",
    priority: "CRITICAL",
    location: "Kankarbagh, Patna",
    lat: 25.5863,
    lng: 85.174,
    instruction: "Verify pump operation and report water level at the lagoon intake.",
    status: "Not Started",
  },
  {
    id: "t2",
    title: "Deliver 50 Medical Kits to District Hospital",
    priority: "HIGH",
    location: "Patliputra Road, Patna",
    lat: 25.6125,
    lng: 85.145,
    instruction: "Hand kits to the medical officer. Log delivery with a signature.",
    status: "En Route",
  },
  {
    id: "t3",
    title: "Verify Flooding at Bypass Road",
    priority: "CRITICAL",
    location: "Bypass Road, Patna",
    lat: 25.5941,
    lng: 85.1376,
    instruction: "Confirm water depth across the carriageway; flag for closure if passable height < 0.3 m.",
    status: "Not Started",
  },
  {
    id: "t4",
    title: "Restock Drinking Water at Sampatchak Shelter",
    priority: "HIGH",
    location: "Sampatchak, Patna",
    lat: 25.5743,
    lng: 85.1376,
    instruction: "Deliver 200 bottled units and log shelf-level photo to the shelter record.",
    status: "Completed",
  },
  {
    id: "t5",
    title: "Walkthrough Streets of Rajendra Nagar",
    priority: "ROUTINE",
    location: "Rajendra Nagar, Patna",
    lat: 25.6066,
    lng: 85.1208,
    instruction: "Routine reconnaissance; log any low-water crossings or stranded households.",
    status: "En Route",
  },
];

export async function listAssignments(): Promise<FieldAssignment[]> {
  return MOCK_TASKS;
}

export async function updateAssignmentStatus(
  id: string,
  status: AssignmentStatus,
): Promise<FieldAssignment> {
  const found = MOCK_TASKS.find((t) => t.id === id);
  if (!found) throw new Error("Assignment not found.");
  found.status = status;
  return found;
}
