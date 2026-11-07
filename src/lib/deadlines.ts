import { ALERT_OPTIONS, alertDate, firstYearReminder, itemWarranties, type AlertKey, type WarrantyItem } from "@/lib/warranty";

export type Deadline = { id: string; name: string; date: string; warrantyKey: string; warranty: string; kind: "end" | "first-year" | AlertKey; label: string };

type DeadlineItem = WarrantyItem & { id: string; name: string; alerts?: unknown };

/** Prochaines fins de garantie et rappels (à partir d'aujourd'hui), triés par date. */
export function upcomingDeadlines(items: DeadlineItem[], today: string, limit = 5): Deadline[] {
  const out: Deadline[] = [];
  for (const i of items) {
    out.push({ id: i.id, name: i.name, date: firstYearReminder(i.purchase_date), warrantyKey: "base", warranty: "Rappel", kind: "first-year", label: "Fin de la première année" });
    for (const w of itemWarranties(i)) {
      out.push({ id: i.id, name: i.name, date: w.end, warrantyKey: w.key, warranty: w.label, kind: "end", label: "Fin de garantie" });
      for (const a of (Array.isArray(i.alerts) ? i.alerts : []) as AlertKey[]) {
        out.push({ id: i.id, name: i.name, date: alertDate(w.end, a), warrantyKey: w.key, warranty: w.label, kind: a, label: `Alerte ${ALERT_OPTIONS.find((o) => o.key === a)?.label ?? ""}`.trim() });
      }
    }
  }
  return out.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, limit);
}

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Recherche insensible aux accents et à la casse sur nom, marque, magasin, catégorie et description. */
export function matchesSearch(item: { name: string; brand?: string | null; store?: string | null; category?: string | null; description?: string | null }, query: string) {
  const q = norm(query.trim());
  if (!q) return true;
  const hay = norm([item.name, item.brand, item.store, item.category, item.description].filter(Boolean).join(" "));
  return q.split(/\s+/).every((t) => hay.includes(t));
}

/** Étape en cours du guide de démarches, selon l'état enregistré. */
export function currentReturnStep(hasSavedLetter: boolean, sentDate: string | null | undefined, drafting: boolean): 1 | 2 | 3 {
  if (hasSavedLetter) return 3;
  return drafting ? 2 : 1;
}

export type ItemDeadlines = { id: string; name: string; date: string; entries: Deadline[] };

/** Regroupe des échéances par objet (une ligne par objet), dans l'ordre de leur première date. */
export function groupByItem(ds: Deadline[]): ItemDeadlines[] {
  const map = new Map<string, ItemDeadlines>();
  for (const d of [...ds].sort((a, b) => a.date.localeCompare(b.date))) {
    const g = map.get(d.id);
    if (g) g.entries.push(d);
    else map.set(d.id, { id: d.id, name: d.name, date: d.date, entries: [d] });
  }
  return [...map.values()];
}

/** Prochaines échéances, une ligne par objet. */
export function upcomingByItem(items: DeadlineItem[], today: string, limit = 5): ItemDeadlines[] {
  return groupByItem(upcomingDeadlines(items, today, Infinity)).slice(0, limit);
}

/** Objet classé : toutes ses garanties sont expirées. */
export function isArchived(item: WarrantyItem, today: string) {
  return itemWarranties(item).every((w) => w.end < today);
}

/** Prochaine fin de garantie encore active (ou null si tout est expiré). */
export function nextActiveEnd(item: WarrantyItem, today: string): string | null {
  const ends = itemWarranties(item).map((w) => w.end).filter((e) => e >= today).sort();
  return ends[0] ?? null;
}

/** Tri par échéance : la garantie active la plus proche d'abord, objets sans garantie active à la fin. */
export function sortByDeadline<T extends WarrantyItem>(items: T[], today: string): T[] {
  return [...items].sort((a, b) => {
    const ea = nextActiveEnd(a, today), eb = nextActiveEnd(b, today);
    if (ea === eb) return 0;
    if (!ea) return 1;
    if (!eb) return -1;
    return ea.localeCompare(eb);
  });
}

export type QuickFilter = "tous" | "bientot" | "sans-prix";
export const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "bientot", label: "Expire sous 90 jours" },
  { key: "sans-prix", label: "Sans prix" },
];

export function applyQuickFilter<T extends WarrantyItem & { price?: number | null }>(items: T[], filter: QuickFilter, today: string): T[] {
  if (filter === "bientot") return items.filter((i) => { const e = nextActiveEnd(i, today); return e !== null && daysLeftISO(e, today) <= 90; });
  if (filter === "sans-prix") return items.filter((i) => i.price == null);
  return items;
}

const daysLeftISO = (end: string, today: string) => Math.round((Date.parse(end) - Date.parse(today)) / 86400000);

/** Valeur protégée : somme des prix des objets ayant au moins une garantie active aujourd'hui. */
export function protectedValue(items: (WarrantyItem & { price?: number | null })[], today: string) {
  const active = items.filter((i) => nextActiveEnd(i, today) !== null);
  const priced = active.filter((i) => i.price != null);
  return { total: priced.reduce((s, i) => s + Number(i.price), 0), priced: priced.length, unpriced: active.length - priced.length, active: active.length };
}
