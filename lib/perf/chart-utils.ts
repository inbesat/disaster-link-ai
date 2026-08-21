// ---------------------------------------------------------------------
// lib/perf/chart-utils.ts — Chart & Data Viz Performance Utilities
//
// Provides dataset downsampling (max 500 points per chart), Page
// Visibility API tracking (`document.visibilityState`), and memoized
// chart properties to prevent lag and unnecessary re-renders.
// ---------------------------------------------------------------------

import { useEffect, useState } from "react";

/**
 * Downsamples a dataset to a maximum point limit (default 500 points) using uniform sampling.
 */
export function downsampleDataset<T>(data: T[], maxPoints = 500): T[] {
  if (!data || data.length <= maxPoints) return data;
  const factor = (data.length - 1) / (maxPoints - 1);
  const sampled: T[] = [data[0]];
  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.round(i * factor);
    sampled.push(data[index]);
  }
  sampled.push(data[data.length - 1]);
  return sampled;
}

/**
 * Custom React hook tracking browser tab visibility via document.visibilityState.
 * Used by charts to pause animations and chart updates when the tab is backgrounded.
 */
export function useChartVisibility(): boolean {
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return document.visibilityState === "visible";
    }
    return true;
  });

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return visible;
}
