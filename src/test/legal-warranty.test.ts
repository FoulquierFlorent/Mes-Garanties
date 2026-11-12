import { describe, expect, it } from "vitest";
import { estimateLegalWarranty } from "@/lib/legal-warranty";

describe("estimation de la garantie légale", () => {
  it("neuf chez un professionnel en France : 24 mois", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "pro", condition: "neuf" })).toMatchObject({ months: 24, certainty: "applicable" });
  });
  it("entre particuliers : aucune garantie de conformité", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "particulier", condition: "occasion" }).months).toBe(0);
  });
  it("occasion chez un professionnel : estimation de 24 mois", () => {
    expect(estimateLegalWarranty({ country: "france", seller: "pro", condition: "occasion" })).toMatchObject({ months: 24, certainty: "estimation" });
  });
  it("hors UE : durée non déterminée", () => {
    expect(estimateLegalWarranty({ country: "hors_ue", seller: "pro", condition: "neuf" }).months).toBeNull();
  });
});
