import { describe, expect, it } from "vitest";
import { parseReceipt } from "@/lib/scan";

const TICKET_ELECTRO = `MAGASIN BOULANGER
12 RUE DE LA PAIX 75002 PARIS
TICKET N° 004512
LE 14/03/2025 18:42

CASQUE SONY WH-1000XM5
1 x 349,99 €
TVA 20% 58,33 €
TOTAL 349,99 €
CARTE BANCAIRE 349,99 €
MERCI DE VOTRE VISITE`;

const TICKET_MEUBLE = `IKEA
MAGASIN DE VILLEJUIF
CANAPÉ 3 PLACES GRÖNLID
2 499,00 €
LE 25/11/2024
TOTAL 2 499,00 €`;

describe("lecture d'un justificatif", () => {
  it("relève la date, le magasin, la marque, la catégorie et le nom de l'objet", () => {
    const fields = parseReceipt(TICKET_ELECTRO);
    expect(fields.purchase_date).toBe("2025-03-14");
    expect(fields.store).toBe("Boulanger");
    expect(fields.brand).toBe("Sony");
    expect(fields.category).toBe("Électronique");
    expect(fields.name).toMatch(/CASQUE/i);
  });

  it("reconnaît un ticket de meuble avec une date française", () => {
    const fields = parseReceipt(TICKET_MEUBLE);
    expect(fields.purchase_date).toBe("2024-11-25");
    expect(fields.store).toBe("IKEA");
    expect(fields.category).toBe("Meuble");
    expect(fields.name).toMatch(/CANAP/i);
  });

  it("ne devine rien sur un justificatif illisible", () => {
    expect(parseReceipt("   \n  ")).toEqual({});
  });
});


describe("numéro de facture lu sur le ticket", () => {
  it("repère le numéro et la date de facture", () => {
    const r = parseReceipt("DARTY\nFacture N° FA-2025-0142\nDate 12/03/2025\nCasque Sony 99,00 €");
    expect(r.order_number).toBe("FA-2025-0142");
    expect(r.order_date).toBe("2025-03-12");
  });

  it("repère le numéro quand l'OCR perd le signe ° après le n", () => {
    const r = parseReceipt("MAGASIN BOULANGER\nFacture n FA-2025-0187\nDate : 12/03/2025\nSONY Casque WH-1000XM5");
    expect(r.order_number).toBe("FA-2025-0187");
    expect(r.order_date).toBe("2025-03-12");
  });

  it("prend le numéro quand il est sur la ligne suivante", () => {
    const r = parseReceipt("CARREFOUR\nFacture\nN° 004512\n14/03/2025");
    expect(r.order_number).toBe("004512");
  });

  it("ne confond pas un montant avec un numéro de facture", () => {
    const r = parseReceipt("LEROY MERLIN\nFacture\nTOTAL 349,99\n14/03/2025");
    expect(r.order_number).toBeUndefined();
  });

  it("ignore la date quand le numéro est sur la même ligne", () => {
    const r = parseReceipt("DARTY\nFacture du 12/03/2025 n° FA-2025-0187");
    expect(r.order_number).toBe("FA-2025-0187");
  });
});

describe("prix lu sur le ticket", () => {
  it("lit le total et ignore la TVA", () => {
    expect(parseReceipt("TVA 20% 58,33\nTOTAL 1 299,90 €\n").price).toBe("1299.90");
  });
});
