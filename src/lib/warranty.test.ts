import { describe, expect, it } from "vitest";
import { alertDate, warrantyEnd, status, itemWarranties, WARRANTY_YEARS, firstYearReminder } from "./warranty";

describe("garantie", () => {
  it("rappelle la fin de la première année à partir de la date d’achat", () => {
    expect(firstYearReminder("2025-10-28")).toBe("2026-10-28");
    expect(firstYearReminder("2024-02-29")).toBe("2025-02-28");
  });
  it("propose uniquement des durées en années entières", () => {
    expect(WARRANTY_YEARS.slice(0, 3)).toEqual([1, 2, 3]);
    expect(WARRANTY_YEARS.every((y) => Number.isInteger(y) && y >= 1)).toBe(true);
  });
  it("calcule séparément la garantie magasin et la garantie de marque", () => {
    expect(itemWarranties({ purchase_date: "2025-03-15", warranty_months: 24, store_warranty_years: 1, brand_warranty_years: 3 })).toEqual([
      { key: "base", label: "Garantie légale", end: "2027-03-15" },
      { key: "store", label: "Garantie magasin", end: "2026-03-15" },
      { key: "brand", label: "Garantie de marque", end: "2028-03-15" },
    ]);
  });
  it("préserve la garantie existante sans en inventer d'autres", () => {
    expect(itemWarranties({ purchase_date: "2024-01-31", warranty_months: 1, store_warranty_years: null, brand_warranty_years: null })).toEqual([{ key: "base", label: "Garantie légale", end: "2024-02-29" }]);
  });
  it("fin de garantie = date d'achat + durée", () => {
    expect(warrantyEnd("2025-03-15", 24)).toBe("2027-03-15");
    expect(warrantyEnd("2024-01-31", 1)).toBe("2024-02-29");
  });
  it("alerte 6 mois avant", () => expect(alertDate("2027-03-15", "6m")).toBe("2026-09-15"));
  it("alerte 3 mois avant", () => expect(alertDate("2027-03-15", "3m")).toBe("2026-12-15"));
  it("alerte 1 mois avant", () => expect(alertDate("2027-03-15", "1m")).toBe("2027-02-15"));
  it("alerte 1 semaine avant", () => expect(alertDate("2027-03-15", "1w")).toBe("2027-03-08"));
  it("statut", () => {
    expect(status("2026-01-01", "2026-02-01")).toBe("expired");
    expect(status("2026-03-01", "2026-02-01")).toBe("soon");
  });
});

import { itemWarranties as iw } from "./warranty";
import { it as it2, expect as ex2 } from "vitest";
it2("une garantie supplémentaire part de sa date de début si elle est renseignée", () => {
  const w = iw({ purchase_date: "2024-01-10", warranty_months: 24, store_warranty_years: 1, warranty_details: { store: { start_date: "2024-03-01" } } });
  ex2(w.find((x) => x.key === "store")?.end).toBe("2025-03-01");
});
