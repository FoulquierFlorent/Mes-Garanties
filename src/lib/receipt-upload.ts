import { supabase } from "@/integrations/supabase/client";

/** Range un justificatif dans le dossier privé de l'objet, avec son texte lu si on le connaît. */
export async function uploadReceipt(itemId: string, file: File, text?: string): Promise<string> {
  const safe = file.name.replace(/[^\w.\-]/g, "_");
  const name = `${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from("receipts").upload(`${itemId}/${name}`, file);
  if (error) throw error;
  if (text && text.trim()) {
    await supabase.storage
      .from("receipts")
      .upload(`${itemId}/${name}.ocr.txt`, new Blob([text], { type: "text/plain;charset=utf-8" }));
  }
  return name;
}
