/** Estimation de la garantie légale de conformité selon le contexte d'achat (droit français/UE). */
export type PurchaseCountry = "france" | "ue" | "hors_ue";
export type SellerType = "pro" | "particulier" | "cadeau" | "inconnu";
export type ItemCondition = "neuf" | "occasion" | "reconditionne";
export type LegalContext = { country: PurchaseCountry; seller: SellerType; condition: ItemCondition };

export type LegalEstimate = {
  /** Durée proposée en mois, ou null si elle ne peut pas être déterminée. */
  months: number | null;
  certainty: "applicable" | "estimation" | "inconnue";
  note: string;
  /** Présomption d'antériorité du défaut, lorsque la règle française est déterminable. */
  presumptionMonths?: number;
};

export const DEFAULT_LEGAL_CONTEXT: LegalContext = { country: "france", seller: "pro", condition: "neuf" };

export function estimateLegalWarranty({ country, seller, condition }: LegalContext): LegalEstimate {
  if (country === "hors_ue") return { months: null, certainty: "inconnue", note: "Achat hors Union européenne : les règles locales s'appliquent. Vérifiez la durée auprès du vendeur." };
  if (seller === "particulier") return { months: 0, certainty: "applicable", note: "Entre particuliers, pas de garantie légale de conformité automatique. La garantie des vices cachés peut s’appliquer : l’action doit être engagée dans les 2 ans de la découverte du vice, sous réserve du délai maximal de 20 ans et des conditions légales." };
  if (seller === "cadeau") return { months: null, certainty: "inconnue", note: "Pour un cadeau acheté initialement auprès d’un professionnel, utilisez la date de livraison initiale et le justificatif d’achat. Ne repartez pas automatiquement de la date à laquelle le cadeau a été reçu." };
  if (seller === "inconnu") return { months: null, certainty: "inconnue", note: "Origine inconnue : renseignez une durée uniquement si votre contrat ou votre justificatif permet de la confirmer." };
  if (country === "ue") return { months: 24, certainty: "estimation", note: "Achat dans un autre pays de l’UE : au moins 2 ans, selon le droit du pays du vendeur. Vérifiez les règles applicables à la date d’achat." };
  if (condition === "occasion" || condition === "reconditionne") return { months: 24, certainty: "applicable", presumptionMonths: 12, note: `Bien ${condition === "occasion" ? "d’occasion" : "reconditionné"} acheté à un professionnel en France : 24 mois. La présomption d’antériorité du défaut est de 12 mois, sous réserve des règles applicables à la date d’achat.` };
  return { months: 24, certainty: "applicable", presumptionMonths: 24, note: "Achat neuf auprès d’un professionnel en France : 24 mois. La présomption d’antériorité du défaut est de 24 mois, sous réserve des exceptions et des règles applicables à la date d’achat." };
}

/** Retrouve le contexte enregistré sans inventer celui des objets anciens. */
export function legalContextFromDetails(value: unknown): LegalContext | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = (value as Record<string, unknown>)["purchase_context"];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const context = raw as Record<string, unknown>;
  const countries: readonly string[] = ["france", "ue", "hors_ue"];
  const sellers: readonly string[] = ["pro", "particulier", "cadeau", "inconnu"];
  const conditions: readonly string[] = ["neuf", "occasion", "reconditionne"];
  if (!countries.includes(String(context["country"])) || !sellers.includes(String(context["seller"])) || !conditions.includes(String(context["condition"]))) return null;
  return { country: context["country"] as PurchaseCountry, seller: context["seller"] as SellerType, condition: context["condition"] as ItemCondition };
}

/** Date indicative seulement : elle ne doit jamais produire une alerte d’expiration automatique. */
export function hiddenDefectDate(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const raw = (value as Record<string, unknown>)["vices_caches"];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const date = (raw as Record<string, unknown>)["discovery_date"];
  return typeof date === "string" ? date : "";
}
