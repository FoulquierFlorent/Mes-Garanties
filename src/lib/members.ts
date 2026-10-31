// Couleur stable attribuée à chaque membre d'un foyer.
// La même personne garde la même couleur partout (contour d'objet, liste des membres).

const MEMBER_CLASSES = [
  "member-1",
  "member-2",
  "member-3",
  "member-4",
  "member-5",
  "member-6",
] as const;

function memberIndex(userId?: string | null): number {
  if (!userId) return -1;
  let h = 0;
  for (let i = 0; i < userId.length; i += 1) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  return h % MEMBER_CLASSES.length;
}

/** Classe de bordure (ex. `border-member-3`) pour le contour d'un objet. */
export function memberBorderClass(userId?: string | null): string {
  const i = memberIndex(userId);
  return i < 0 ? "border-border" : `border-${MEMBER_CLASSES[i]}`;
}

/** Classe de fond (ex. `bg-member-3`) pour un repère de couleur. */
export function memberDotClass(userId?: string | null): string {
  const i = memberIndex(userId);
  return i < 0 ? "bg-muted-foreground" : `bg-${MEMBER_CLASSES[i]}`;
}

/** Couleurs d'encadré qu'un membre peut choisir pour son carré. */
export const FRAME_COLORS = [
  { key: "bleu", label: "Bleu" }, { key: "blanc", label: "Blanc" }, { key: "noir", label: "Noir" },
  { key: "marron", label: "Marron" }, { key: "rouge", label: "Rouge" }, { key: "vert", label: "Vert" },
  { key: "orange", label: "Orange" }, { key: "rose", label: "Rose" }, { key: "violet", label: "Violet" },
  { key: "jaune", label: "Jaune" },
] as const;

/** Couleur CSS de l'encadré : choix du membre, sinon sa couleur automatique. */
export function memberFrameColor(color: string | null | undefined, userId?: string | null): string {
  if (color && FRAME_COLORS.some((c) => c.key === color)) return `var(--frame-${color})`;
  const i = memberIndex(userId);
  return i < 0 ? "var(--border)" : `var(--${MEMBER_CLASSES[i]})`;
}
