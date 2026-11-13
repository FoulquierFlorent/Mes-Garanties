import { describe, it, expect } from "vitest";
import { ALERT_PRESETS, alertModeOf } from "@/lib/warranty";
describe("modes d'alertes", () => {
  it("standard = 1 mois et 1 semaine", () => expect(ALERT_PRESETS.standard).toEqual(["1m", "1w"]));
  it("renforcées = 6m, 3m, 1m, 1s", () => expect(ALERT_PRESETS.renforcees).toEqual(["6m", "3m", "1m", "1w"]));
  it("reconnaît un choix personnalisé", () => expect(alertModeOf(["3m"])).toBe("personnalisees"));
  it("aucune alerte = désactivées", () => expect(alertModeOf([])).toBe("aucune"));
});
