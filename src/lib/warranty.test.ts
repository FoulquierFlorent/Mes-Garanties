import { describe, expect, it } from "vitest";
import { alertDate, warrantyEnd, status } from "./warranty";

describe("garantie", () => {
  it("fin de garantie = date d'achat + durée", () => {
    expect(warrantyEnd("2025-03-15", 24)).toBe("2027-03-15");
    expect(warrantyEnd("2024-01-31", 1)).toBe("2024-02-29");
  });
  it("alerte 3 mois avant", () => expect(alertDate("2027-03-15", "3m")).toBe("2026-12-15"));
  it("alerte 1 mois avant", () => expect(alertDate("2027-03-15", "1m")).toBe("2027-02-15"));
  it("alerte 1 semaine avant", () => expect(alertDate("2027-03-15", "1w")).toBe("2027-03-08"));
  it("statut", () => {
    expect(status("2026-01-01", "2026-02-01")).toBe("expired");
    expect(status("2026-03-01", "2026-02-01")).toBe("soon");
  });
});
