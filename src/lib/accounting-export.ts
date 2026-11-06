import type { Item } from "@/lib/items";

export type AccountingEntry = {
  item: Item;
  memberName: string;
  receiptNames: string[];
};

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** CSV compatible avec les tableurs français : séparateur point-virgule et BOM UTF-8. */
export function buildAccountingCsv(entries: AccountingEntry[]): string {
  const header = ["Objet", "Catégorie", "Membre", "Date d'achat", "Date de facture", "N° de facture ou commande", "Magasin", "Marque", "Prix EUR", "Nombre de justificatifs", "Justificatifs"];
  const lines = entries.map(({ item, memberName, receiptNames }) => [
    item.name,
    item.category,
    memberName,
    item.purchase_date,
    item.order_date,
    item.order_number,
    item.store,
    item.brand,
    item.price === null ? null : item.price.toFixed(2),
    receiptNames.length,
    receiptNames.join(" | "),
  ].map(csvCell).join(";"));
  return `\uFEFF${[header.map(csvCell).join(";"), ...lines].join("\r\n")}\r\n`;
}

export type ZipReceipt = {
  itemName: string;
  name: string;
  blob: Blob;
};

function safePart(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "objet";
}

/** Archive les vrais justificatifs et un sommaire permettant de vérifier leur rattachement. */
export async function makeReceiptsZip(receipts: ZipReceipt[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Set<string>();
  receipts.forEach((receipt, index) => {
    const base = `${String(index + 1).padStart(3, "0")}-${safePart(receipt.itemName)}-${safePart(receipt.name)}`;
    let path = base;
    let suffix = 2;
    while (used.has(path)) path = `${base}-${suffix++}`;
    used.add(path);
    zip.file(path, receipt.blob);
  });
  const manifest = ["index;objet;fichier", ...receipts.map((r, i) => `${i + 1};${csvCell(r.itemName)};${csvCell(r.name)}`)].join("\r\n");
  zip.file("sommaire-des-justificatifs.csv", `\uFEFF${manifest}\r\n`);
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}
