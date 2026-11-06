import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildAccountingCsv, makeReceiptsZip, type AccountingEntry } from "@/lib/accounting-export";
import type { Item } from "@/lib/items";

const item = {
  id: "item-1",
  user_id: "member-1",
  name: "Ordinateur \"Pro\"; 15 pouces",
  category: "Électronique",
  purchase_date: "2026-01-15",
  order_date: "2026-01-15",
  order_number: "FA-2026-001",
  store: "Magasin; République",
  brand: "Marque",
  price: 1299.9,
} as Item;

describe("export comptable Titane", () => {
  it("produit un CSV UTF-8 lisible par les tableurs français, avec les valeurs protégées", () => {
    const entry: AccountingEntry = { item, memberName: "Florent", receiptNames: ["facture.pdf", "ticket.png"] };
    const csv = buildAccountingCsv([entry]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain('"Objet";"Catégorie";"Membre"');
    expect(csv).toContain('"Ordinateur ""Pro""; 15 pouces"');
    expect(csv).toContain('"Magasin; République"');
    expect(csv).toContain('"1299.90";"2";"facture.pdf | ticket.png"');
    expect(csv).toContain("Électronique");
  });

  it("place chaque justificatif attendu dans le ZIP avec un sommaire", async () => {
    const blob = await makeReceiptsZip([
      { itemId: item.id, itemName: item.name, name: "facture achat.pdf", blob: new Blob(["PDF-TEST"], { type: "application/pdf" }) },
      { itemId: item.id, itemName: item.name, name: "ticket.png", blob: new Blob(["PNG-TEST"], { type: "image/png" }) },
    ]);
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
    const zip = await JSZip.loadAsync(buffer);
    const names = Object.keys(zip.files);
    expect(names).toHaveLength(3);
    expect(names.some((name) => name.includes("facture-achat.pdf"))).toBe(true);
    expect(names.some((name) => name.includes("ticket.png"))).toBe(true);
    expect(await zip.file("sommaire-des-justificatifs.csv")?.async("string")).toContain("facture achat.pdf");
    const pdfPath = names.find((name) => name.includes("facture-achat.pdf"))!;
    expect(await zip.file(pdfPath)?.async("string")).toBe("PDF-TEST");
  });
});
