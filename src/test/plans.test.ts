import { describe, expect, it } from "vitest";
import {
  FAMILY_PLAN,
  FREE_PLAN,
  INDIVIDUAL_PLANS,
  PRO_PLANS,
  SOLO_PLAN,
  TITANE_PLAN,
  bestSavingsPercent,
  formatEuro,
  savingsPercent,
  yearlySavings,
} from "@/lib/plans";

describe("formules et prix de la page Tarifs", () => {
  it("la grille particuliers compte trois niveaux, sans la formule Duo", () => {
    expect(INDIVIDUAL_PLANS.map((p) => p.name)).toEqual(["Gratuit", "Solo", "Famille"]);
    expect(INDIVIDUAL_PLANS.some((p) => p.name.includes("Duo"))).toBe(false);
  });

  it("l'offre professionnels est Titane, présentée à part", () => {
    expect(PRO_PLANS.map((p) => p.name)).toEqual(["Mes garanties Titane"]);
  });

  it("les prix mensuels et annuels sont ceux annoncés", () => {
    expect(FREE_PLAN.monthly).toBeNull();
    expect([SOLO_PLAN.monthly, SOLO_PLAN.yearly]).toEqual([2.99, 24.99]);
    expect([FAMILY_PLAN.monthly, FAMILY_PLAN.yearly]).toEqual([4.99, 44.99]);
    expect([TITANE_PLAN.monthly, TITANE_PLAN.yearly]).toEqual([9.99, 99.99]);
  });

  it("l'économie annuelle est calculée et affichée en français", () => {
    expect(yearlySavings(SOLO_PLAN)).toBe(10.89);
    expect(yearlySavings(FAMILY_PLAN)).toBe(14.89);
    expect(yearlySavings(TITANE_PLAN)).toBe(19.89);
    expect(formatEuro(2.99)).toBe("2,99 €");
    expect(formatEuro(10.89)).toBe("10,89 €");
    expect(savingsPercent(SOLO_PLAN)).toBe(30);
    expect(bestSavingsPercent()).toBe(30);
    expect(yearlySavings(FREE_PLAN)).toBe(0);
  });

  it("Famille reprend Solo et l'offre pro exporte les factures", () => {
    expect(FAMILY_PLAN.items).toContain("Tout la formule Solo");
    expect(FAMILY_PLAN.items).toContain("Attribution des objets par membre");
    expect(TITANE_PLAN.items).toContain("Export comptable zippé des factures");
    expect(SOLO_PLAN.items).toContain("Scan OCR automatique des factures");
  });
});

import { canAddItem as _canAdd } from "@/lib/plans";
describe("plafond Gratuit", () => {
  it("autorise le 5e objet", () => expect(_canAdd("gratuit", 4)).toBe(true));
  it("bloque le 6e objet", () => expect(_canAdd("gratuit", 5)).toBe(false));
  it("Solo illimité", () => expect(_canAdd("solo", 50)).toBe(true));
});
