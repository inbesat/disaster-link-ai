export type RoadClosureLike = {
  id: string;
  lat: number;
  lng: number;
  reason: string;
  isActive: boolean;
  createdAt?: string;
};

/**
 * Fetch the persisted road closures. Returns an empty array on any error so
 * the map degrades gracefully when the DB is unreachable.
 */
export async function fetchRoadClosures(): Promise<RoadClosureLike[]> {
  try {
    const response = await fetch("/api/road-closures", { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { closures?: RoadClosureLike[] };
    return data.closures ?? [];
  } catch {
    return [];
  }
}

/** Persist a new road closure placed by the admin tool. Never throws. */
export async function addRoadClosure(input: {
  lat: number;
  lng: number;
  reason?: string;
}): Promise<RoadClosureLike | null> {
  try {
    const response = await fetch("/api/road-closures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { closure?: RoadClosureLike };
    return data.closure ?? null;
  } catch {
    return null;
  }
}

/** Mark a road closure resolved (road reopened). */
export async function resolveRoadClosure(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/road-closures/${encodeURIComponent(id)}`, {
      method: "PATCH",
    });
    return response.ok;
  } catch {
    return false;
  }
}
