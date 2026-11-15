import type { ScanFields } from "@/lib/scan";

/** Nettoie la réponse de l'IA : ne garde que des valeurs plausibles, au bon format. */
export function sanitizeAiReceipt(raw: unknown, categories: string[]): ScanFields {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown, max = 120) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  const date = (v: unknown) => {
    const s = str(v, 10);
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
    const d = new Date(`${s}T00:00:00Z`);
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && d.getUTCFullYear() >= 1990 ? s : undefined;
  };
  const n = typeof r["price"] === "number" ? r["price"] : Number(String(r["price"] ?? "").replace(",", "."));
  const price = Number.isFinite(n) && n > 0 && n < 1_000_000 ? n.toFixed(2) : undefined;
  const cat = str(r["category"]);
  const out: Record<keyof ScanFields, string | undefined> = {
    name: str(r["name"]),
    brand: str(r["brand"], 60),
    store: str(r["store"], 80),
    purchase_date: date(r["purchase_date"]),
    order_number: str(r["order_number"], 60),
    order_date: date(r["order_date"]),
    price,
    category: cat && categories.includes(cat) ? cat : undefined,
  };
  return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as ScanFields;
}
