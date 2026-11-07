import { describe, expect, it } from "vitest";
import { buildInventoryCsv } from "@/lib/inventory-csv";

describe("export CSV de l'inventaire", () => {
  it("écrit une ligne par garantie avec son statut", () => {
    const csv = buildInventoryCsv([{ name: 'TV "55"', category: "Électronique", purchase_date: "2026-01-01", warranty_months: 24, store_warranty_years: 3, price: 499 }], "2026-11-07");
    const rows = csv.replace("\uFEFF", "").trim().split("\r\n");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toContain('"TV ""55"""');
    expect(rows[1]).toContain('"2028-01-01";"Active"');
    expect(rows[2]).toContain('"2029-01-01"');
  });
});
