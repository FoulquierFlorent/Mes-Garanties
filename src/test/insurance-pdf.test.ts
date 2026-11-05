import { describe, it, expect } from "vitest";
import { buildInsuranceRows } from "@/lib/insurance-pdf";
const base = { id: "a", name: "TV", category: "Électronique", brand: null, user_id: "u", order_number: null, warranty_months: 24 } as any;
describe("dossier assurance", () => {
  it("additionne les valeurs d'achat et compte les objets sans prix", () => {
    const r = buildInsuranceRows([{ ...base, price: 499.9, purchase_date: "2026-01-01" }, { ...base, id: "b", price: 100.1, purchase_date: "2026-01-01" }, { ...base, id: "c", price: null, purchase_date: "2026-01-01" }], "2026-11-05");
    expect(r.total).toBe(600);
    expect(r.unpriced).toBe(1);
  });
  it("un objet dont toutes les garanties sont passées est expiré", () => {
    const r = buildInsuranceRows([{ ...base, price: 1, purchase_date: "2020-01-01" }], "2026-11-05");
    expect(r.rows[0].overall).toBe("expired");
  });
});
