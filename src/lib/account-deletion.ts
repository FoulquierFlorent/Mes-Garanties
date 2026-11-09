/** Règles de suppression définitive d'un compte. */
export type DeletionItem = { id: string; user_id: string; household_id: string | null };

/**
 * Les objets personnels (hors foyer, ou foyer sans autre membre) sont effacés avec leurs fichiers.
 * Les objets d'un foyer partagé avec d'autres membres restent dans le foyer.
 */
export function planAccountDeletion(userId: string, items: DeletionItem[], sharedHouseholdIds: Set<string>) {
  const mine = items.filter((i) => i.user_id === userId);
  const kept = mine.filter((i) => i.household_id && sharedHouseholdIds.has(i.household_id));
  const deleted = mine.filter((i) => !kept.includes(i));
  return { deleteItemIds: deleted.map((i) => i.id), keptSharedCount: kept.length };
}

export const DELETE_CONFIRMATION_WORD = "SUPPRIMER";
