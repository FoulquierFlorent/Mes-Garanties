export type LetterInput = {
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
  casse: "est cassé dans des conditions normales d'utilisation",
  hs: "ne fonctionne plus",
};

export function buildLetter(i: LetterInput) {
  const product = [i.itemName, i.brand].filter(Boolean).join(" — ");
  return `${i.senderName || "[Votre nom]"}
${i.senderAddress || "[Votre adresse]"}

À l'attention du service client
${i.store || "[Nom du vendeur]"}

Le ${i.today}

Objet : demande de remplacement ou de réparation au titre de la garantie

Madame, Monsieur,

Le ${i.purchaseDate}, j'ai acheté dans votre enseigne le produit suivant : ${product}. Ce produit est couvert par une garantie valable jusqu'au ${i.warrantyEnd}.

Or, ce produit ${PROBLEMS[i.problem]}.${i.details ? `\n\n${i.details}` : ""}

Conformément à la garantie légale de conformité (articles L.217-3 et suivants du Code de la consommation) et à la garantie commerciale dont il bénéficie, je vous demande de bien vouloir procéder à son remplacement ou, à défaut, à sa réparation, sans frais.

Vous trouverez ci-joint une copie de ma preuve d'achat.

Dans l'attente de votre réponse, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${i.senderName || "[Votre nom]"}`;
}
