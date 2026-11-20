import { describe, expect, it } from "vitest";
import { estimateLegalWarranty, hiddenDefectDate, legalContextFromDetails } from "@/lib/legal-warranty";

describe("estimation de la garantie légale", () => {
  it("neuf chez un professionnel en France : 24 mois et présomption de 24 mois", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "pro", condition: "neuf" })).toMatchObject({ months: 24, certainty: "applicable", presumptionMonths: 24 });
  });
  it("entre particuliers : aucune garantie de conformité automatique", () => {
    const estimate = estimateLegalWarranty({ country: "france", seller: "particulier", condition: "occasion" });
    expect(estimate.months).toBe(0);
    expect(estimate.note).toContain("2 ans de la découverte du vice");
    expect(estimate.note).toContain("20 ans");
  });
  it("occasion chez un professionnel : 24 mois et présomption de 12 mois", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "pro", condition: "occasion" })).toMatchObject({ months: 24, certainty: "applicable", presumptionMonths: 12 });
  });
  it("reconditionné chez un professionnel : 24 mois et présomption de 12 mois", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "pro", condition: "reconditionne" })).toMatchObject({ months: 24, certainty: "applicable", presumptionMonths: 12 });
  });
  it("cadeau : aucune date de départ n’est inventée", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "cadeau", condition: "neuf" })).toMatchObject({ months: null, certainty: "inconnue" });
  });
  it("origine inconnue : aucune durée automatique", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "inconnu", condition: "neuf" }).months).toBeNull();
  });
  it("hors UE : durée non déterminée", () => {
    expect(estimateLegalWarranty({ country: "hors_ue", seller: "pro", condition: "neuf" }).months).toBeNull();
  });
  it("retrouve le contexte et la découverte d’un vice sans toucher aux objets anciens", () => {
    const details = { purchase_context: { country: "france", seller: "particulier", condition: "occasion" }, vices_caches: { discovery_date: "2026-11-20" } };
    expect(legalContextFromDetails(details)).toEqual({ country: "france", seller: "particulier", condition: "occasion" });
    expect(hiddenDefectDate(details)).toBe("2026-11-20");
    expect(legalContextFromDetails({})).toBeNull();
    expect(hiddenDefectDate({})).toBe("");
  });
});
