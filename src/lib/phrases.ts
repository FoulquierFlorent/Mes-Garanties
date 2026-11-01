// Messages d'information rappelant que les garanties sont un droit.
// Utilisés par RightBanner (bandeaux d'information et petites écritures).
// Ton : informatif et décontracté, pas publicitaire.

export const WARRANTY_PHRASES = [
  "La garantie légale de conformité couvre vos achats pendant 2 ans : réparation ou remplacement gratuit.",
  "Un objet en panne avant la fin de la garantie ? C'est au vendeur d'intervenir, pas à vous de payer.",
  "Gardez vos tickets ici : ils serviront le jour où vous en aurez besoin.",
  "Une garantie ne se demande pas, elle se fait valoir.",
  "Les réparations couvertes ne coûtent rien : autant savoir quand elles s'appliquent.",
  "En cas de problème, une lettre bien rédigée suffit souvent à obtenir gain de cause.",
  "Les dates de fin de garantie sont notées pour vous : pas besoin de les retenir.",
  "Tout est au même endroit : vos achats, vos garanties, vos justificatifs.",
  "Un souci avec un achat ? Votre ticket est déjà là, prêt à être joint au dossier.",
  "Scanner un ticket prend quelques secondes et protège l'achat pendant des années.",
  "Votre suivi de retour est gardé de côté jusqu'à ce que le colis reparte.",
  "Finis les tickets perdus au fond d'un tiroir.",
  "Un dossier bien préparé, c'est déjà la moitié du chemin.",
  "Vos garanties sont des droits : cette application vous aide à les faire respecter.",
  "Deux ans pour faire valoir la garantie légale, on vous rappelle quand il faut agir.",
];

/** Nombre de jours depuis l'époque : sert à faire tourner les phrases chaque jour. */
export function daySeed(today = new Date()): number {
  return Math.floor(today.getTime() / 86_400_000);
}

/** Une phrase différente chaque jour, décalée par `offset` pour varier les emplacements. */
export function phraseOfDay(seed: number, offset = 0): string {
  const n = WARRANTY_PHRASES.length;
  const idx = (((seed + offset) % n) + n) % n;
  return WARRANTY_PHRASES[idx] ?? "";
}
