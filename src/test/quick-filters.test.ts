import { describe, expect, it } from "vitest";
import { applyQuickFilter, protectedValue, sortByDeadline } from "@/lib/deadlines";

const today = "2026-11-07";
const mk = (id: string, purchase_date: string, price: number | null, warranty_months = 24) => ({ id, name: id, purchase_date, warranty_months, price });
const soon = mk("soon", "2024-12-01", 100);      // fin 2026-12-01
const later = mk("later", "2026-01-01", 50);     // fin 2028-01-01
const expired = mk("expired", "2020-01-01", 900); // expiré
const noPrice = mk("noPrice", "2025-06-01", null);

describe("tri par échéance", () => {
  it("met la garantie la plus proche en premier et les expirés à la fin", () => {
    expect(sortByDeadline([expired, later, soon, noPrice], today).map((i) => i.id)).toEqual(["soon", "noPrice", "later", "expired"]);
  });
  it("renvoie une liste vide sans objet", () => {
    expect(sortByDeadline([], today)).toEqual([]);
  });
});

describe("filtres rapides", () => {
  it("« Expire sous 90 jours » garde uniquement les garanties actives proches", () => {
    expect(applyQuickFilter([soon, later, expired], "bientot", today).map((i) => i.id)).toEqual(["soon"]);
  });
  it("« Sans prix » garde les objets sans montant", () => {
    expect(applyQuickFilter([soon, noPrice], "sans-prix", today).map((i) => i.id)).toEqual(["noPrice"]);
  });
  it("renvoie vide quand aucun objet ne correspond", () => {
    expect(applyQuickFilter([later, expired], "bientot", today)).toEqual([]);
    expect(applyQuickFilter([soon], "sans-prix", today)).toEqual([]);
  });
});

describe("valeur protégée", () => {
  it("additionne seulement les objets dont une garantie est active", () => {
    expect(protectedValue([soon, later, expired, noPrice], today)).toEqual({ total: 150, priced: 2, unpriced: 1, active: 3 });
  });
  it("vaut zéro sans montant renseigné", () => {
    expect(protectedValue([noPrice], today).priced).toBe(0);
  });
});
