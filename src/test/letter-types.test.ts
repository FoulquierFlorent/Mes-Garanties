import { describe, expect, it } from "vitest";
import { buildLetter, type LetterInput } from "@/lib/letter";

const input: LetterInput = { senderName: "Florent", senderAddress: "Adresse", store: "Magasin test", brand: "Marque test", itemName: "Lave-linge", purchaseDate: "15 janvier 2025", warrantyEnd: "15 janvier 2027", problem: "panne", details: "", today: "30 octobre 2026" };
describe("lettres par garantie", () => {
  it("adresse la garantie légale au vendeur avec les règles de conformité", () => {
    const letter = buildLetter({ ...input, warrantyType: "base" });
    expect(letter).toContain("service client\nMagasin test");
    expect(letter).toContain("articles L.217-3");
    expect(letter).toContain("trente jours");
  });
  it("adresse la garantie magasin au vendeur selon le contrat commercial", () => {
    const letter = buildLetter({ ...input, warrantyType: "store", warrantyEnd: "15 janvier 2028" });
    expect(letter).toContain("service client\nMagasin test");
    expect(letter).toContain("garantie commerciale du magasin");
    expect(letter).toContain("15 janvier 2028");
    expect(letter).not.toContain("trente jours");
  });
  it("adresse la garantie marque au fabricant selon son contrat et sa date", () => {
    const letter = buildLetter({ ...input, warrantyType: "brand", warrantyEnd: "15 janvier 2030" });
    expect(letter).toContain("service client\nMarque test");
    expect(letter).toContain("garantie commerciale de la marque");
    expect(letter).toContain("15 janvier 2030");
    expect(letter).not.toContain("articles L.217-3");
  });
});