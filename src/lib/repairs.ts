export type RepairType = "legal" | "commercial" | "paid" | "replacement" | "other";
export const REPAIR_TYPES: Record<RepairType, string> = {
  legal: "Réparation sous garantie légale de conformité",
  commercial: "Réparation sous garantie commerciale",
  paid: "Réparation payante hors garantie",
  replacement: "Remplacement du produit",
  other: "Autre intervention",
};
export interface Repair {
  id: string; type: RepairType; failureDate?: string; problem?: string; requestDate?: string;
  dropDate?: string; returnDate?: string; repairer?: string; amount?: number; partsWarrantyMonths?: number;
}
export function parseRepairs(v: unknown): Repair[] {
  if (!Array.isArray(v)) return [];
  return v.filter((r): r is Repair => !!r && typeof r === "object" && typeof (r as Repair).id === "string" && (r as Repair).type in REPAIR_TYPES);
}
const d = (s: string) => new Date(`${s}T00:00:00Z`);
const iso = (x: Date) => x.toISOString().slice(0, 10);
function addMonths(s: string, m: number) { const x = d(s); x.setUTCMonth(x.getUTCMonth() + m); return iso(x); }
function addDays(s: string, n: number) { const x = d(s); x.setUTCDate(x.getUTCDate() + n); return iso(x); }
const days = (a: string, b: string) => Math.max(0, Math.round((d(b).getTime() - d(a).getTime()) / 86400000));

/** Fin ajustée de la garantie légale : +6 mois par réparation légale (période d'immobilisation incluse, non cumulée),
 * nouveau délai de 24 mois après un remplacement. Les réparations payantes ne prolongent jamais l'appareil. */
export function adjustedLegalEnd(baseEnd: string | null, repairs: Repair[]): string | null {
  if (!baseEnd) return null;
  let end = baseEnd;
  const sorted = [...repairs].sort((a, b) => (a.returnDate ?? "").localeCompare(b.returnDate ?? ""));
  for (const r of sorted) {
    if (r.type === "replacement" && r.returnDate) { end = addMonths(r.returnDate, 24); continue; }
    if (r.type !== "legal" || !r.returnDate) continue;
    const start = r.requestDate ?? r.dropDate;
    const immobilised = start ? days(start, r.returnDate) : 0;
    const extended = addMonths(end, 6);
    const withImmobilisation = addDays(end, immobilised);
    end = extended > withImmobilisation ? extended : withImmobilisation;
  }
  return end;
}
export function partsWarrantyEnd(r: Repair): string | null {
  return r.type === "paid" && r.returnDate && r.partsWarrantyMonths ? addMonths(r.returnDate, r.partsWarrantyMonths) : null;
}
