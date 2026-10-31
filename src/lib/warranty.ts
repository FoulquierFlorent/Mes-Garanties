export type AlertKey = "6m" | "3m" | "1m" | "1w";

export const ALERT_OPTIONS: { key: AlertKey; label: string }[] = [
  { key: "6m", label: "6 mois avant la fin de la garantie légale" },
  { key: "3m", label: "3 mois avant la fin de la garantie légale" },
  { key: "1m", label: "1 mois avant la fin de la garantie légale" },
  { key: "1w", label: "1 semaine avant la fin de la garantie légale" },
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

export function firstYearReminder(purchaseDate: string): string {
  return warrantyEnd(purchaseDate, 12);
}

export const WARRANTY_YEARS = Array.from({ length: 100 }, (_, i) => i + 1);
export const yearsLabel = (years: number) => `${years} ${years === 1 ? "an" : "ans"}`;

/** Les 6 garanties suivies par l'application. */
export type WarrantyKey = "base" | "store" | "brand" | "constructor" | "extension" | "repair";

export const WARRANTY_LABELS: Record<WarrantyKey, string> = {
  base: "Garantie légale",
  store: "Garantie magasin",
  brand: "Garantie de marque",
  constructor: "Garantie constructeur",
  extension: "Garantie d’extension",
  repair: "Garantie de réparation",
};

/** Garanties facultatives, exprimées en années entières. */
export const OPTIONAL_WARRANTY_KEYS = ["store", "brand", "constructor", "extension", "repair"] as const;

export type WarrantyItem = {
  purchase_date: string;
  warranty_months: number;
  store_warranty_years?: number | null;
  brand_warranty_years?: number | null;
  constructor_warranty_years?: number | null;
  extension_warranty_years?: number | null;
  repair_warranty_years?: number | null;
};

export type Warranty = { key: WarrantyKey; label: string; end: string };

export function itemWarranties(item: WarrantyItem): Warranty[] {
  const warranties: Warranty[] = [
    { key: "base", label: WARRANTY_LABELS.base, end: warrantyEnd(item.purchase_date, item.warranty_months) },
  ];
  const optional: [WarrantyKey, number | null | undefined][] = [
    ["store", item.store_warranty_years],
    ["brand", item.brand_warranty_years],
    ["constructor", item.constructor_warranty_years],
    ["extension", item.extension_warranty_years],
    ["repair", item.repair_warranty_years],
  ];
  for (const [key, years] of optional) {
    if (years) warranties.push({ key, label: WARRANTY_LABELS[key], end: warrantyEnd(item.purchase_date, years * 12) });
  }
  return warranties;
}

export function alertDate(endDate: string, key: AlertKey): string {
  const end = parse(endDate);
  if (key === "6m") return toISO(addMonths(end, -6));
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
