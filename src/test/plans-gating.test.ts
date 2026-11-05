import { describe, it, expect } from "vitest";
import { canExportInsurance, PLAN_LABELS } from "@/lib/plans";

describe("accès au dossier assurance", () => {
  it("est réservé aux offres Solo et Famille", () => {
    expect(canExportInsurance("solo")).toBe(true);
    expect(canExportInsurance("famille")).toBe(true);
    expect(canExportInsurance("gratuit")).toBe(false);
    expect(canExportInsurance("titane")).toBe(false);
    expect(canExportInsurance(null)).toBe(false);
    expect(canExportInsurance(undefined)).toBe(false);
  });
  it("chaque offre du foyer a un libellé", () => {
    expect(PLAN_LABELS.gratuit).toBe("Gratuit");
    expect(PLAN_LABELS.solo).toBe("Solo");
    expect(PLAN_LABELS.famille).toBe("Famille");
    expect(PLAN_LABELS.titane).toBe("Mes garanties Titane");
  });
});
