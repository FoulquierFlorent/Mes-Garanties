import { describe, expect, it } from "vitest";
import { currentReturnStep, matchesSearch, upcomingDeadlines } from "./deadlines";

const base = { warranty_months: 24, alerts: [] as string[] };

describe("upcomingDeadlines", () => {
  it("returns the 5 next deadlines sorted, ignoring past ones", () => {
    const items = [
      { ...base, id: "a", name: "A", purchase_date: "2025-01-10", store_warranty_years: 3 },
      { ...base, id: "b", name: "B", purchase_date: "2020-01-01" },
      { ...base, id: "c", name: "C", purchase_date: "2025-06-01", alerts: ["1m"] },
    ];
    const r = upcomingDeadlines(items, "2026-01-01");
    expect(r).toHaveLength(5);
    expect(r.map((d) => d.date)).toEqual(["2026-01-10", "2026-06-01", "2027-01-10", "2027-05-01", "2027-06-01"]);
    expect(r.some((d) => d.id === "b")).toBe(false);
    expect(r[2]?.warrantyKey).toBe("base");
  });
});

describe("matchesSearch", () => {
  const item = { name: "Lave-linge", brand: "Bosch", store: "Darty", category: "Électroménager", description: "Hublot 8 kg" };
  it.each(["bosch", "darty", "electromenager", "hublot", "lave bosch"])("finds %s", (q) => expect(matchesSearch(item, q)).toBe(true));
  it("rejects non-matching text", () => expect(matchesSearch(item, "télé")).toBe(false));
});

describe("currentReturnStep", () => {
  it("follows saved state", () => {
    expect(currentReturnStep(false, null, false)).toBe(1);
    expect(currentReturnStep(false, null, true)).toBe(2);
    expect(currentReturnStep(true, null, true)).toBe(3);
    expect(currentReturnStep(true, "2026-01-02", false)).toBe(3);
  });
});

import { groupByItem, isArchived, upcomingByItem } from "./deadlines";
describe("regroupement et classement", () => {
  it("one line per item in upcoming deadlines", () => {
    const items = [{ ...base, id: "a", name: "A", purchase_date: "2025-01-10", store_warranty_years: 3, alerts: ["1m"] }];
    const r = upcomingByItem(items, "2026-01-01");
    expect(r).toHaveLength(1);
    expect(r[0]!.entries.length).toBeGreaterThan(1);
    expect(groupByItem([]).length).toBe(0);
  });
  it("archives an item only when all warranties are expired", () => {
    expect(isArchived({ purchase_date: "2020-01-01", warranty_months: 24 }, "2026-01-01")).toBe(true);
    expect(isArchived({ purchase_date: "2020-01-01", warranty_months: 24, brand_warranty_years: 10 }, "2026-01-01")).toBe(false);
  });
});
