/** Estimation de la garantie légale de conformité selon le contexte d'achat (droit français/UE). */
export type PurchaseCountry = "france" | "ue" | "hors_ue";
export type SellerType = "pro" | "particulier";
export type ItemCondition = "neuf" | "occasion";
export type LegalContext = { country: PurchaseCountry; seller: SellerType; condition: ItemCondition };

export type LegalEstimate = {
  /** Durée proposée en mois, ou null si elle ne peut pas être déterminée. */
  months: number | null;
  certainty: "applicable" | "estimation" | "inconnue";
  note: string;
};

export const DEFAULT_LEGAL_CONTEXT: LegalContext = { country: "france", seller: "pro", condition: "neuf" };

export function estimateLegalWarranty({ country, seller, condition }: LegalContext): LegalEstimate {
  if (country === "hors_ue") return { months: null, certainty: "inconnue", note: "Achat hors Union européenne : les règles locales s'appliquent. Vérifiez la durée auprès du vendeur." };
  if (seller === "particulier") return { months: 0, certainty: "applicable", note: "Entre particuliers, la garantie légale de conformité ne s'applique pas. Seule la garantie des vices cachés peut être invoquée." };
  if (condition === "occasion") return { months: 24, certainty: "estimation", note: "Bien d'occasion acheté à un professionnel : 2 ans, sauf si le contrat la réduit à 1 an minimum. Corrigez si besoin." };
  if (country === "ue") return { months: 24, certainty: "estimation", note: "Achat dans un autre pays de l'UE : au moins 2 ans, selon le droit du pays du vendeur." };
  return { months: 24, certainty: "applicable", note: "Achat neuf auprès d'un professionnel en France : 2 ans de garantie légale de conformité." };
}
