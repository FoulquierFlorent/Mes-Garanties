export type WarrantyLetterType = "base" | "store" | "brand";

export type LetterInput = {
  warrantyType?: WarrantyLetterType;
  senderName: string;
  senderAddress: string;
  store: string;
  itemName: string;
  brand?: string | null;
  purchaseDate: string; // formatted
  warrantyEnd: string; // formatted
  problem: "panne" | "casse" | "hs";
  details: string;
  today: string; // formatted
};

const PROBLEMS = {
  panne: "présente un dysfonctionnement",
  casse: "est détérioré ou cassé",
  hs: "ne fonctionne plus",
};

export function buildLetter(i: LetterInput) {
  const product = [i.itemName, i.brand].filter(Boolean).join(" — ");
  const type = i.warrantyType ?? "base";
  const warranty = type === "store" ? "garantie commerciale du magasin" : type === "brand" ? "garantie commerciale de la marque" : "garantie légale de conformité";
  const recipient = type === "brand" ? i.brand || "[Nom de la marque]" : i.store || "[Nom du vendeur]";
  const request = type === "base"
    ? `Je vous demande la mise en conformité du bien par son remplacement, au titre de la garantie légale de conformité (articles L.217-3 et suivants, notamment L.217-9, du Code de la consommation), sous réserve que ce défaut relève de cette garantie. Si le remplacement est impossible ou entraîne un coût disproportionné au sens de la loi, je vous remercie de motiver votre décision et de me proposer une réparation.

La mise en conformité doit être effectuée sans frais, dans un délai raisonnable ne dépassant pas trente jours suivant ma demande et sans inconvénient majeur, conformément aux articles L.217-10 et L.217-11. Merci de m'indiquer les modalités de prise en charge.`
    : `Je sollicite la prise en charge de ce produit au titre de la ${warranty}, conformément aux conditions du contrat de garantie et sous réserve que le défaut constaté soit couvert. Je souhaite son remplacement si les conditions de cette garantie le permettent ; à défaut, merci de m'indiquer la solution prévue par le contrat.

Merci de me préciser la procédure de retour, l'adresse d'expédition, les éventuels frais prévus au contrat ainsi que les délais de traitement. Cette demande au titre d'une garantie commerciale ne limite pas les droits dont je peux bénéficier au titre des garanties légales.`;
  return `${i.senderName || "[Votre nom]"}
${i.senderAddress || "[Votre adresse]"}

À l'attention du service client
${recipient}

Le ${i.today}

Objet : demande de remplacement ou de réparation — ${warranty}

Madame, Monsieur,

Le ${i.purchaseDate}, j'ai acheté ${type === "brand" ? `auprès de ${i.store || "[Nom du vendeur]"}` : "dans votre enseigne"} le produit suivant : ${product}. La date de fin de la ${warranty} renseignée dans mon dossier est le ${i.warrantyEnd}.

Or, ce produit ${PROBLEMS[i.problem]}.${i.details ? `\n\n${i.details}` : ""}

${request}

Vous trouverez ci-joint une copie de ma preuve d'achat.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${i.senderName || "[Votre nom]"}`;
}
