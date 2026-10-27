import { supabase } from "@/integrations/supabase/client";

export async function uploadItemPhotos(itemId: string, files: File[]) {
  const failed: File[] = [];
  for (const file of files) {
    const path = `${itemId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    const { error } = await supabase.storage.from("item-photos").upload(path, file);
    if (error) failed.push(file);
  }
  return failed;
}