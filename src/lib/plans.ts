export type PlanSpec = {
  name: string;
  description: string;
  /** Prix mensuel en euros, ou null pour une formule gratuite. */
  monthly: number | null;
  /** Prix annuel en euros, ou null pour une formule gratuite. */
  yearly: number | null;
  items: string[];
  cta: string;
  soon?: boolean;
  recommended?: boolean;
};

export const FREE_PLAN: PlanSpec = {
  name: "Gratuit",
  description: "De quoi bien commencer, sans engagement.",
  monthly: null,
  yearly: null,
  items: ["5 objets", "Rappels simples", "1 export PDF par mois", "Scans limités"],
  cta: "Créer un compte",
};

export const SOLO_PLAN: PlanSpec = {
  name: "Solo",
  description: "Pour une personne qui réunit tous ses achats, factures et garanties au même endroit.",
  monthly: 2.99,
  yearly: 24.99,
  items: [
    "Objets illimités",
    "Scan OCR automatique des factures",
    "Dossier assurance complet en PDF",
    "Générateur de courriers SAV",
  ],
  cta: "Choisir Solo",
  recommended: true,
};

export const FAMILY_PLAN: PlanSpec = {
  name: "Famille",
  description: "Pour toute la maison : le même espace, partagé et attribué à chacun.",
  monthly: 4.99,
  yearly: 44.99,
  items: [
    "Tout la formule Solo",
    "Partagé entre les membres du foyer",
    "Comptes reliés",
    "Attribution des objets par membre",
  ],
  cta: "Choisir Famille",
};

export const TITANE_PLAN: PlanSpec = {
  name: "Mes garanties Titane",
  description: "Pour les indépendants et les entrepreneurs qui suivent leur matériel professionnel.",
  monthly: 9.99,
  yearly: 99.99,
  items: [
    "Export comptable zippé des factures",
    "Suivi du parc de matériel",
    "Dossier assurance pro",
  ],
  cta: "Choisir Titane",
};

/** Grille « particuliers » : trois niveaux. */
export const INDIVIDUAL_PLANS: PlanSpec[] = [FREE_PLAN, SOLO_PLAN, FAMILY_PLAN];

/** Offre réservée aux professionnels, présentée dans sa propre section. */
export const PRO_PLANS: PlanSpec[] = [TITANE_PLAN];

/** Identifiants d'offre enregistrés sur le foyer. */
export type PlanId = "gratuit" | "solo" | "famille" | "titane";

export const PLAN_LABELS: Record<PlanId, string> = {
  gratuit: "Gratuit",
  solo: "Solo",
  famille: "Famille",
  titane: "Mes garanties Titane",
};

/** Le dossier d'assurance complet est réservé aux offres Solo et Famille. */
export function canExportInsurance(plan: string | null | undefined): boolean {
  return plan === "solo" || plan === "famille";
}

export function formatEuro(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

/** Montant économisé en payant à l'année plutôt que 12 fois le prix mensuel. */
export function yearlySavings(plan: PlanSpec): number {
  if (plan.monthly === null || plan.yearly === null) return 0;
  return Math.round((plan.monthly * 12 - plan.yearly) * 100) / 100;
}

/** Part économisée en payant à l'année, en pourcentage arrondi. */
export function savingsPercent(plan: PlanSpec): number {
  if (plan.monthly === null || plan.yearly === null) return 0;
  return Math.round((1 - plan.yearly / (plan.monthly * 12)) * 100);
}

/** Plus belle économie annuelle parmi des formules payantes. */
export function bestSavingsPercent(plans: PlanSpec[] = [...INDIVIDUAL_PLANS, ...PRO_PLANS]): number {
  return plans.reduce((best, plan) => Math.max(best, savingsPercent(plan)), 0);
}
