import { describe, expect, it } from "vitest";
import { buildLetter, type LetterInput } from "@/lib/letter";

const base: LetterInput = {
  senderName: "Florent Foulquier",
  senderAddress: "1 rue des Lilas, 75011 Paris",
  store: "Boulanger",
  itemName: "Casque sans fil",
  brand: "Sony",
  purchaseDate: "14 mars 2025",
  warrantyEnd: "14 mars 2027",
  problem: "panne",
  details: "",
  today: "31 octobre 2026",
};

describe("pièces jointes de la lettre", () => {
  it("mentionne la photo de l'objet endommagé quand une photo est dans le dossier", () => {
    const letter = buildLetter({ ...base, warrantyType: "store", photoCount: 2 });
    expect(letter).toContain("preuve d'achat ainsi qu'une photo de l'objet endommagé");
  });

  it("ne mentionne pas de photo quand l'objet n'a aucune photo", () => {
    const letter = buildLetter({ ...base, warrantyType: "store" });
    expect(letter).not.toContain("photo de l'objet endommagé");
  });
});

describe("numéro de commande dans la lettre", () => {
  it("reprend le numéro de commande ou facture enregistré", () => {
    expect(buildLetter({ ...base, orderNumber: "FA-123" })).toContain("Référence de la commande ou de la facture : FA-123.");
  });
  it("n'ajoute rien sans numéro", () => {
    expect(buildLetter(base)).not.toContain("Référence de la commande");
  });
  it("reprend la date d'achat enregistrée", () => {
    expect(buildLetter({ ...base, warrantyType: "brand" })).toContain("Le 14 mars 2025, j'ai acheté auprès de Boulanger");
  });
});
