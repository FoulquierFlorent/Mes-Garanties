import { itemWarranties, status, type WarrantyItem } from "@/lib/warranty";

type InvItem = WarrantyItem & { name: string; category: string; brand?: string | null; store?: string | null; price?: number | null };
const cell = (v: string | number | null | undefined) => `"${(v == null ? "" : String(v)).replace(/"/g, '""')}"`;
const STATUS = { active: "Active", soon: "Bientôt expirée", expired: "Expirée" } as const;

/** Inventaire : une ligne par garantie de chaque objet ; séparateur « ; » et BOM pour les tableurs français. */
export function buildInventoryCsv(items: InvItem[], today: string): string {
  const header = ["Objet", "Catégorie", "Marque", "Magasin", "Prix EUR", "Date d'achat", "Garantie", "Fin de garantie", "Statut"];
  const lines = items.flatMap((i) => itemWarranties(i).map((w) => [
    i.name, i.category, i.brand, i.store, i.price == null ? null : Number(i.price).toFixed(2), i.purchase_date, w.label, w.end, STATUS[status(w.end, today)],
  ].map(cell).join(";")));
  return `\uFEFF${[header.map(cell).join(";"), ...lines].join("\r\n")}\r\n`;
}
