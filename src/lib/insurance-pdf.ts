import { itemWarranties, status, type Status } from "@/lib/warranty";
import type { Item } from "@/lib/items";

export type InsuranceRow = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  owner: string;
  purchaseDate: string;
  orderNumber: string | null;
  price: number | null;
  warranties: { label: string; end: string; status: Status }[];
  overall: Status;
};

/** Récapitulatif du dossier : un objet par ligne, valeur totale déclarée. */
export function buildInsuranceRows(items: Item[], today: string, names: Record<string, string> = {}) {
  const rows: InsuranceRow[] = items.map((it) => {
    const warranties = itemWarranties(it).map((w) => ({ ...w, status: status(w.end, today) }));
    const overall: Status = warranties.some((w) => w.status === "active")
      ? "active"
      : warranties.some((w) => w.status === "soon") ? "soon" : "expired";
    return {
      id: it.id, name: it.name, category: it.category, brand: it.brand,
      owner: names[it.user_id] ?? "—", purchaseDate: it.purchase_date,
      orderNumber: it.order_number, price: it.price, warranties, overall,
    };
  });
  const total = Math.round(rows.reduce((s, r) => s + (r.price ?? 0), 0) * 100) / 100;
  return { rows, total, unpriced: rows.filter((r) => r.price == null).length };
}

export const STATUS_TEXT: Record<Status, string> = { active: "Couverte", soon: "Bientôt expirée", expired: "Expirée" };

/** Les polices PDF standard ne connaissent pas certains espaces/caractères. */
const clean = (s: string) =>
  s.replace(/[\u202F\u00A0]/g, " ").replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[^\x20-\x7E\u00A0-\u00FF€'"–—…°]/g, "");
const euro = (n: number) => clean(new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n));
const date = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR");

export type ReceiptFile = { itemId: string; name: string; blob: Blob };

export async function makeInsurancePdf(opts: {
  owner: string; items: Item[]; names: Record<string, string>; today: string; receipts: ReceiptFile[];
}): Promise<Blob> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { rows, total, unpriced } = buildInsuranceRows(opts.items, opts.today, opts.names);
  const W = 595, H = 842, M = 48;
  let page = doc.addPage([W, H]);
  let y = H - M;
  const ink = rgb(0.12, 0.12, 0.14), muted = rgb(0.45, 0.45, 0.48);
  const text = (s: string, x: number, size = 10, f = font, color = ink) => page.drawText(clean(s), { x, y, size, font: f, color });
  const fit = (s: string, max: number, size: number, f = font) => {
    let t = clean(s);
    while (t.length > 1 && f.widthOfTextAtSize(t, size) > max) t = t.slice(0, -2) + "…";
    return t;
  };
  const ensure = (h: number) => { if (y - h < M) { page = doc.addPage([W, H]); y = H - M; } };

  text("Dossier d'assurance — Mes garanties", M, 20, bold); y -= 22;
  text(`Établi pour ${opts.owner} le ${date(opts.today)}`, M, 10, font, muted); y -= 26;
  text(`${rows.length} objet(s) enregistré(s) · Valeur d'achat totale : ${euro(total)}`, M, 12, bold); y -= 16;
  if (unpriced) { text(`${unpriced} objet(s) sans prix renseigné.`, M, 9, font, muted); y -= 14; }
  y -= 10;

  const cols = [M, M + 170, M + 260, M + 335, M + 410];
  const header = () => {
    ["Objet", "Date d'achat", "Valeur", "Justificatifs", "Garanties"].forEach((h, i) => text(h, cols[i], 9, bold, muted));
    y -= 6; page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: muted }); y -= 14;
  };
  header();
  for (const r of rows) {
    const files = opts.receipts.filter((f) => f.itemId === r.id);
    const lines = Math.max(2, r.warranties.length);
    ensure(lines * 11 + 10);
    if (y === H - M) header();
    const top = y;
    text(fit(r.name, 165, 10, bold), cols[0], 10, bold); y -= 11;
    text(fit([r.category, r.brand, r.owner].filter(Boolean).join(" · "), 165, 8), cols[0], 8, font, muted);
    if (r.orderNumber) { y -= 10; text(fit(`N° ${r.orderNumber}`, 165, 8), cols[0], 8, font, muted); }
    const bottom = y; y = top;
    text(date(r.purchaseDate), cols[1]);
    text(r.price == null ? "—" : euro(r.price), cols[2]);
    text(files.length ? `${files.length} en annexe` : "Aucun", cols[3]);
    r.warranties.forEach((w) => {
      text(fit(`${w.label.replace("Garantie ", "")} : ${STATUS_TEXT[w.status]} (${date(w.end)})`, W - M - cols[4], 8), cols[4], 8, font, w.status === "expired" ? muted : ink);
      y -= 11;
    });
    y = Math.min(y, bottom - 11) - 6;
    page.drawLine({ start: { x: M, y: y + 8 }, end: { x: W - M, y: y + 8 }, thickness: 0.2, color: rgb(0.85, 0.85, 0.85) });
  }

  // Annexes : chaque justificatif à la suite, rattaché à son objet.
  const byId = new Map(rows.map((r) => [r.id, r.name]));
  for (const f of opts.receipts) {
    const label = `Justificatif — ${byId.get(f.itemId) ?? ""} — ${f.name.replace(/^\d+-/, "")}`;
    const bytes = new Uint8Array(await f.blob.arrayBuffer());
    try {
      if (f.blob.type === "application/pdf" || /\.pdf$/i.test(f.name)) {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copied = await doc.copyPages(src, src.getPageIndices());
        copied.forEach((p, i) => {
          doc.addPage(p);
          if (i === 0) p.drawText(fit(label, p.getWidth() - 40, 8), { x: 20, y: 12, size: 8, font, color: muted });
        });
        continue;
      }
      const img = /png/i.test(f.blob.type) || /\.png$/i.test(f.name) ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      page = doc.addPage([W, H]); y = H - M;
      text(fit(label, W - 2 * M, 11, bold), M, 11, bold);
      const s = Math.min((W - 2 * M) / img.width, (H - 2 * M - 30) / img.height, 1);
      page.drawImage(img, { x: M, y: H - M - 20 - img.height * s, width: img.width * s, height: img.height * s });
    } catch {
      page = doc.addPage([W, H]); y = H - M;
      text(fit(label, W - 2 * M, 11, bold), M, 11, bold); y -= 18;
      text("Ce fichier n'a pas pu être intégré : il reste consultable dans l'application.", M, 10, font, muted);
    }
  }
  const out = await doc.save();
  return new Blob([out as BlobPart], { type: "application/pdf" });
}
