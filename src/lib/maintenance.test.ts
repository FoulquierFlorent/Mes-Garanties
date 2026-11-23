import { describe, it, expect } from "vitest";
import { totals, entryStatus, addMonths } from "./maintenance";
const e = (o: object) => ({ kind: "courant", done_date: null, next_date: null, amount: null, covered_amount: null, ...o });
describe("carnet d'entretien", () => {
  it("lave-linge : 35 € entretien, 89 € réparation, 120 € pris en charge", () => {
    const t = totals([e({ amount: 35 }), e({ kind: "reparation", amount: 89 }), e({ kind: "reparation", amount: 0, covered_amount: 120 })]);
    expect(t).toEqual({ maintenance: 35, repair: 89, covered: 120, paid: 124 });
    expect(499 + t.paid).toBe(623);
  });
  it("statuts", () => {
    expect(entryStatus(e({ next_date: "2026-01-01" }), "2026-02-01")).toBe("retard");
    expect(entryStatus(e({ next_date: "2026-02-10" }), "2026-02-01")).toBe("bientot");
    expect(entryStatus(e({ next_date: "2026-06-10" }), "2026-02-01")).toBe("programme");
    expect(entryStatus(e({}), "2026-02-01")).toBe("fait");
  });
  it("prochain entretien", () => expect(addMonths("2026-01-31", 12)).toBe("2027-01-31"));
});
