export const MAINTENANCE_KINDS = {
  courant: "Entretien courant", preventif: "Entretien préventif", reparation: "Réparation", revision: "Révision",
  nettoyage: "Nettoyage", piece: "Remplacement d’une pièce", controle: "Contrôle technique", logiciel: "Mise à jour logicielle", autre: "Autre intervention",
} as const;
export type MaintenanceKind = keyof typeof MAINTENANCE_KINDS;
export const FREQUENCIES = [{ v: 1, l: "Tous les mois" }, { v: 3, l: "Tous les 3 mois" }, { v: 6, l: "Tous les 6 mois" }, { v: 12, l: "Tous les ans" }, { v: 24, l: "Tous les 2 ans" }];

const S: [RegExp, string[]][] = [
  [/auto|voiture|moto|véhicule/i, ["Vidange", "Révision", "Contrôle technique", "Remplacement des pneus", "Remplacement des plaquettes de frein", "Changement de batterie"]],
  [/vélo|sport/i, ["Lubrification de la chaîne", "Vérification des freins", "Remplacement des pneus", "Révision générale"]],
  [/électroménager|cuisine|lave|frigo/i, ["Détartrage", "Nettoyage des filtres", "Nettoyage des joints", "Remplacement des pièces d’usure"]],
  [/électronique|informatique|téléphone|ordinateur|high/i, ["Nettoyage", "Remplacement de la batterie", "Mise à jour logicielle", "Réparation de l’écran"]],
  [/maison|chauffage|jardin|bricolage|équipement/i, ["Entretien de la chaudière", "Entretien de la climatisation", "Entretien de la pompe à chaleur", "Entretien du chauffe-eau", "Entretien de la piscine", "Nettoyage des filtres"]],
];
export function suggestionsFor(category: string): string[] {
  return S.find(([r]) => r.test(category))?.[1] ?? ["Nettoyage", "Révision", "Remplacement d’une pièce"];
}

export type Entry = { kind: string; done_date: string | null; next_date: string | null; amount: number | null; covered_amount: number | null };
export type Status = "fait" | "programme" | "bientot" | "retard";
export function entryStatus(e: Entry, today: string): Status {
  if (!e.next_date) return "fait";
  if (e.next_date < today) return "retard";
  const soon = new Date(today); soon.setDate(soon.getDate() + 30);
  return e.next_date <= soon.toISOString().slice(0, 10) ? "bientot" : "programme";
}
export function addMonths(iso: string, m: number): string {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + m); return d.toISOString().slice(0, 10);
}
/** Montants payés : la part prise en charge par une garantie n'est jamais comptée comme payée. */
export function totals(entries: Entry[]) {
  let maintenance = 0, repair = 0, covered = 0;
  for (const e of entries) {
    const paid = Number(e.amount ?? 0); covered += Number(e.covered_amount ?? 0);
    if (e.kind === "reparation" || e.kind === "piece") repair += paid; else maintenance += paid;
  }
  return { maintenance, repair, covered, paid: maintenance + repair };
}
