import { describe, it, expect } from "vitest";
import { buildInsuranceRows, filterItemsByPeriod, insuranceFileName } from "@/lib/insurance-pdf";
const base = { id: "a", name: "TV", category: "Électronique", brand: null, user_id: "u", order_number: null, warranty_months: 24 } as any;
describe("dossier assurance", () => {
  it("additionne les valeurs d'achat et compte les objets sans prix", () => {
    const r = buildInsuranceRows([{ ...base, price: 499.9, purchase_date: "2026-01-01" }, { ...base, id: "b", price: 100.1, purchase_date: "2026-01-01" }, { ...base, id: "c", price: null, purchase_date: "2026-01-01" }], "2026-11-05");
    expect(r.total).toBe(600);
    expect(r.unpriced).toBe(1);
  });
  it("un objet dont toutes les garanties sont passées est expiré", () => {
    const r = buildInsuranceRows([{ ...base, price: 1, purchase_date: "2020-01-01" }], "2026-11-05");
    expect(r.rows[0]?.overall).toBe("expired");
  });
  it("filtre les objets sur la période d'achat, bornes incluses", () => {
    const items = [
      { ...base, id: "a", purchase_date: "2025-01-01" },
      { ...base, id: "b", purchase_date: "2025-06-15" },
      { ...base, id: "c", purchase_date: "2026-01-01" },
    ] as any;
    expect(filterItemsByPeriod(items, "2025-01-01", "2025-12-31").map((i: any) => i.id)).toEqual(["a", "b"]);
    expect(filterItemsByPeriod(items, null, null)).toHaveLength(3);
  });
  it("nomme le fichier avec l'offre, la période et la date, sans accents", () => {
    expect(insuranceFileName("Solo", "Année 2025", "2026-11-05")).toBe("dossier-assurance-solo-annee-2025-2026-11-05.pdf");
    expect(insuranceFileName("Famille", "Toutes les dates", "2026-11-05")).toBe("dossier-assurance-famille-toutes-les-dates-2026-11-05.pdf");
  });
});
