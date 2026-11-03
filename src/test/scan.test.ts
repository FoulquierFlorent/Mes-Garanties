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

import { parseReceiptText as _p } from "@/lib/scan";
describe("numéro de facture lu sur le ticket", () => {
  it("repère le numéro et la date de facture", () => {
    const r = _p("DARTY\nFacture N° FA-2025-0142\nDate 12/03/2025\nCasque Sony 99,00 €");
    expect(r.order_number).toBe("FA-2025-0142");
    expect(r.order_date).toBe("2025-03-12");
  });
});
