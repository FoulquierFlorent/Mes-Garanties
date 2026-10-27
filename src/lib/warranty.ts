export type AlertKey = "3m" | "1m" | "1w";

export const ALERT_OPTIONS: { key: AlertKey; label: string }[] = [
  { key: "3m", label: "3 mois avant" },
  { key: "1m", label: "1 mois avant" },
  { key: "1w", label: "1 semaine avant" },
];

function parse(d: string) {
  const [y = 0, m = 1, day = 1] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day));
}

export function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addMonths(d: Date, months: number) {
  const r = new Date(d);
  const day = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + months);
  const last = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(day, last));
  return r;
}

export function warrantyEnd(purchaseDate: string, months: number): string {
  return toISO(addMonths(parse(purchaseDate), months));
}

export const WARRANTY_YEARS = Array.from({ length: 100 }, (_, i) => i + 1);
export const yearsLabel = (years: number) => `${years} ${years === 1 ? "an" : "ans"}`;

export function itemWarranties(item: { purchase_date: string; warranty_months: number; store_warranty_years?: number | null; brand_warranty_years?: number | null }) {
  const warranties = [{ key: "base", label: "Garantie principale", end: warrantyEnd(item.purchase_date, item.warranty_months) }];
  if (item.store_warranty_years) warranties.push({ key: "store", label: "Garantie magasin", end: warrantyEnd(item.purchase_date, item.store_warranty_years * 12) });
  if (item.brand_warranty_years) warranties.push({ key: "brand", label: "Garantie de marque", end: warrantyEnd(item.purchase_date, item.brand_warranty_years * 12) });
  return warranties;
}

export function alertDate(endDate: string, key: AlertKey): string {
  const end = parse(endDate);
  if (key === "3m") return toISO(addMonths(end, -3));
  if (key === "1m") return toISO(addMonths(end, -1));
  const r = new Date(end);
  r.setUTCDate(r.getUTCDate() - 7);
  return toISO(r);
}

export function daysLeft(endDate: string, today: string): number {
  return Math.round((parse(endDate).getTime() - parse(today).getTime()) / 86400000);
}

export type Status = "expired" | "soon" | "active";
export function status(endDate: string, today: string): Status {
  const d = daysLeft(endDate, today);
  if (d < 0) return "expired";
  if (d <= 90) return "soon";
  return "active";
}
