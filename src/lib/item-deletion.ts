import { supabase } from "@/integrations/supabase/client";

const ITEM_BUCKETS = ["receipts", "item-photos"] as const;

/**
 * Supprime définitivement un objet et les fichiers stockés dans ses dossiers dédiés
 * (`receipts/{itemId}/*` et `item-photos/{itemId}/*`).
 * Les fichiers sont supprimés avant la ligne en base afin que les règles d'accès du foyer
 * (`can_access_item`) autorisent la suppression et qu'aucun fichier d'un autre objet ne soit touché.
 */
export async function deleteItemWithFiles(itemId: string): Promise<{ deleted: boolean; fileCleanupWarning: boolean }> {
  let fileCleanupWarning = false;
  for (const bucket of ITEM_BUCKETS) {
    try {
      const { data: files, error: listErr } = await supabase.storage.from(bucket).list(itemId);
      if (listErr) {
        fileCleanupWarning = true;
        continue;
      }
      const paths = (files ?? [])
        .filter((f) => f.name && f.name !== ".emptyFolderPlaceholder")
        .map((f) => `${itemId}/${f.name}`);
      if (paths.length > 0) {
        const { error: remErr } = await supabase.storage.from(bucket).remove(paths);
        if (remErr) fileCleanupWarning = true;
      }
    } catch {
      fileCleanupWarning = true;
    }
  }
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) return { deleted: false, fileCleanupWarning };
  return { deleted: true, fileCleanupWarning };
}