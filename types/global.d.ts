export {};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    posthog: {
      capture: (event: string, properties?: Record<string, unknown>) => void;
      identify: (userId: string, traits?: Record<string, unknown>) => void;
      reset: () => void;
      init: (key: string, config?: Record<string, unknown>) => void;
    };
    va: (event: string, ...args: unknown[]) => void;
  }

  function gtag(...args: unknown[]): void;
  /**
   * Universal API response shape for SafeSphere endpoints.
   */
  interface ApiResponse<T = unknown> {
    ok: boolean;
    data?: T;
    error?: string;
    message?: string;
    status?: number;
  }

  /**
   * User profile representation returned from Supabase / Auth helpers.
   */
  interface UserProfile {
    id: string;
    email: string;
    name?: string | null;
    role: "super_admin" | "district_admin" | "field_responder" | "viewer" | "public" | "guest" | string;
    organization?: string | null;
    assigned_district?: string | null;
    avatar_url?: string | null;
    phone_number?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  }

  /**
   * Common GeoJSON Point feature structure.
   */
  interface GeoJsonPoint {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  }

  /**
   * Common Shelter response object interface.
   */
  interface ShelterRecord {
    id: string;
    name: string;
    district: string;
    capacity: number;
    currentOccupancy: number;
    latitude: number;
    longitude: number;
    status: "open" | "closed" | "full" | string;
    facilities?: string[];
    contactPhone?: string | null;
    contactName?: string | null;
    address?: string | null;
    photoUrl?: string | null;
    distanceKm?: number;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }

  /**
   * Common Flood Alert / Alert Log interface.
   */
  interface AlertRecord {
    id: string;
    title: string;
    severity: "CRITICAL" | "WARNING" | "WATCH" | "INFO" | "SAFE" | string;
    district: string;
    message: string;
    channels?: string[];
    createdAt: Date | string;
    acknowledged?: boolean;
  }

  /**
   * Emergency Document / RAG Chunk interface.
   */
  interface EmergencyDocumentRecord {
    id: string;
    title: string;
    content: string;
    source?: string | null;
    district?: string | null;
    category?: string | null;
    embeddingSource?: string | null;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  }
}
