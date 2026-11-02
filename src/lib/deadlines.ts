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
