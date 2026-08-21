import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parses a JSON string into type T, returning a fallback value (or null) if parsing fails or input is null/undefined/empty.
 */
export function safeParseJSON<T = unknown>(
  value: string | null | undefined,
  fallback: T | null = null
): T | null {
  if (value === null || value === undefined || typeof value !== "string" || value.trim() === "") {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
