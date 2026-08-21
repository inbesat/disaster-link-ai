import { describe, expect, it } from "vitest";

// District isolation helper to simulate RLS row filtering
export function filterRowsByDistrict<T extends { district?: string; source_district?: string; target_district?: string }>(
  rows: T[],
  userDistrict: string,
  userRole: string,
): T[] {
  if (userRole === "super_admin") return rows;

  return rows.filter((row) => {
    if (row.district) return row.district === userDistrict;
    if (row.source_district || row.target_district) {
      return row.source_district === userDistrict || row.target_district === userDistrict;
    }
    return false;
  });
}

describe("District Isolation Rules", () => {
  const shelters = [
    { id: "s1", name: "Patna Shelter", district: "Patna" },
    { id: "s2", name: "Gaya Shelter", district: "Gaya" },
    { id: "s3", name: "Darbhanga Shelter", district: "Darbhanga" },
  ];

  const allocations = [
    { id: "a1", source_district: "Patna", target_district: "Gaya" },
    { id: "a2", source_district: "Darbhanga", target_district: "Muzaffarpur" },
  ];

  it("restricts district_admin from District A from seeing District B data", () => {
    const patnaAdminRows = filterRowsByDistrict(shelters, "Patna", "district_admin");
    expect(patnaAdminRows.length).toBe(1);
    expect(patnaAdminRows[0].id).toBe("s1");

    const gayaAdminRows = filterRowsByDistrict(shelters, "Gaya", "district_admin");
    expect(gayaAdminRows.length).toBe(1);
    expect(gayaAdminRows[0].id).toBe("s2");
  });

  it("allows super_admin to see cross-district data", () => {
    const superAdminRows = filterRowsByDistrict(shelters, "Patna", "super_admin");
    expect(superAdminRows.length).toBe(3);
  });

  it("allows district_admin to see allocations involving their district", () => {
    const patnaAllocations = filterRowsByDistrict(allocations, "Patna", "district_admin");
    expect(patnaAllocations.length).toBe(1);
    expect(patnaAllocations[0].id).toBe("a1");

    const darbhangaAllocations = filterRowsByDistrict(allocations, "Darbhanga", "district_admin");
    expect(darbhangaAllocations.length).toBe(1);
    expect(darbhangaAllocations[0].id).toBe("a2");
  });
});
