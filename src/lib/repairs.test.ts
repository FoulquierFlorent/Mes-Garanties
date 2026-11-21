import { describe, expect, it } from "vitest";
import { adjustedLegalEnd, partsWarrantyEnd } from "./repairs";
describe("réparations", () => {
  it("ajoute 6 mois après une réparation sous garantie légale", () => {
    expect(adjustedLegalEnd("2026-01-10", [{ id: "1", type: "legal", requestDate: "2025-05-01", returnDate: "2025-05-20" }])).toBe("2026-07-10");
  });
  it("ne compte pas l'immobilisation en plus des 6 mois", () => {
    expect(adjustedLegalEnd("2026-01-10", [{ id: "1", type: "legal", requestDate: "2025-01-01", returnDate: "2025-03-01" }])).toBe("2026-07-10");
  });
  it("redémarre 24 mois après un remplacement", () => {
    expect(adjustedLegalEnd("2026-01-10", [{ id: "1", type: "replacement", returnDate: "2025-06-15" }])).toBe("2027-06-15");
  });
  it("une réparation payante ne prolonge pas l'appareil", () => {
    expect(adjustedLegalEnd("2026-01-10", [{ id: "1", type: "paid", returnDate: "2025-06-15", partsWarrantyMonths: 3 }])).toBe("2026-01-10");
    expect(partsWarrantyEnd({ id: "1", type: "paid", returnDate: "2025-06-15", partsWarrantyMonths: 3 })).toBe("2025-09-15");
  });
});
