import { describe, expect, it } from "vitest";
import { dueWarrantyAlerts, dueWarrantyAlertsForItem, normalizeEmailAlertLead, warrantyEmailIdempotencyKey, type EmailWarrantyItem } from "@/lib/warranty-email";

const item: EmailWarrantyItem = {
  id: "objet-1",
  name: "Machine à laver",
  household_id: "foyer-1",
  purchase_date: "2026-01-15",
  warranty_months: 24,
  store_warranty_years: 1,
};

describe("alertes e-mail d’expiration de garantie", () => {
  it.each([
    ["6m", "2027-07-15"],
    ["3m", "2027-10-15"],
    ["1m", "2027-12-15"],
    ["1w", "2028-01-08"],
  ] as const)("envoie le rappel légal au délai %s choisi", (lead, today) => {
    const alert = dueWarrantyAlertsForItem(item, lead, today);
    expect(alert?.warranties).toEqual([{ key: "base", label: "Garantie légale", end: "2028-01-15" }]);
  });

  it("applique le délai personnel à chaque garantie de l’objet", () => {
    const alert = dueWarrantyAlertsForItem(item, "1m", "2026-12-15");
    expect(alert?.warranties).toEqual([{ key: "store", label: "Garantie magasin", end: "2027-01-15" }]);
  });

  it("regroupe les garanties du même objet dans un seul rappel", () => {
    const sameEnd = { ...item, store_warranty_years: 2 };
    const alerts = dueWarrantyAlerts([sameEnd], "1m", "2027-12-15");
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.warranties.map((warranty) => warranty.key)).toEqual(["base", "store"]);
  });

  it("ne produit aucun rappel à une autre date", () => {
    expect(dueWarrantyAlertsForItem(item, "1m", "2027-12-14")).toBeNull();
  });

  it("retombe sur un mois si le délai enregistré est invalide", () => {
    expect(normalizeEmailAlertLead("demain")).toBe("1m");
  });

  it("utilise une clé distincte par membre et stable pour éviter les doublons", () => {
    const first = warrantyEmailIdempotencyKey("membre-1", "objet-1", "1m", "2027-12-15");
    expect(first).toBe(warrantyEmailIdempotencyKey("membre-1", "objet-1", "1m", "2027-12-15"));
    expect(first).not.toBe(warrantyEmailIdempotencyKey("membre-2", "objet-1", "1m", "2027-12-15"));
  });
});
