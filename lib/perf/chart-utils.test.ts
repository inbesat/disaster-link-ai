import { describe, expect, it } from "vitest";
import { downsampleDataset } from "./chart-utils";

describe("downsampleDataset", () => {
  it("returns original dataset when count is under maxPoints", () => {
    const data = [1, 2, 3, 4, 5];
    expect(downsampleDataset(data, 10)).toEqual(data);
  });

  it("downsamples datasets exceeding maxPoints to exactly maxPoints", () => {
    const largeData = Array.from({ length: 1200 }, (_, i) => ({ id: i, value: i * 2 }));
    const result = downsampleDataset(largeData, 500);
    expect(result.length).toBe(500);
    expect(result[0]).toEqual(largeData[0]);
    expect(result[result.length - 1]).toEqual(largeData[largeData.length - 1]);
  });

  it("handles empty array safely", () => {
    expect(downsampleDataset([], 500)).toEqual([]);
  });
});
