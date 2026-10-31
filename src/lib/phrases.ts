// Phrases accrocheuses rappelant que les garanties sont un droit.
// Utilisées par RightBanner (mini banderoles et petites écritures).

export const WARRANTY_PHRASES = [
  "Ne jetez plus vos tickets : transformez-les en droits.",
  "Le ticket s’efface, votre garantie reste.",
  "Vos garanties méritent mieux qu’un fond de tiroir.",
  "La garantie légale de conformité est un droit, pas une faveur.",
  "Et si des centaines d’euros de réparations gratuites dormaient chez vous ?",
  "Ne payez plus pour une panne couverte : enregistrez, réclamez, profitez.",
  "On surveille les dates pour vous. Vous n’avez plus qu’à souffler.",
  "Toutes vos garanties au même endroit, bien au chaud jusqu’au jour J.",
  "Un problème avec un achat ? Votre justificatif est déjà là.",
  "Faites valoir vos droits sans effort : un scan, et votre achat est protégé.",
  "Le bouclier de vos achats dans votre poche.",
  "Finis les tickets perdus, bonjour la tranquillité.",
  "Votre coffre-fort de garanties : le seul endroit où archiver rapporte gros.",
  "Combien de garanties perdues au fond d’un tiroir ? Il est temps de changer d’époque.",
];

/** Nombre de jours depuis l’époque : sert à faire tourner les phrases chaque jour. */
export function daySeed(today = new Date()): number {
  return Math.floor(today.getTime() / 86_400_000);
}

/** Une phrase différente chaque jour, décalée par `offset` pour varier les emplacements. */
export function phraseOfDay(seed: number, offset = 0): string {
  const n = WARRANTY_PHRASES.length;
  return WARRANTY_PHRASES[(((seed + offset) % n) + n) % n];
}
