import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Receipts({ itemId }: { itemId: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const key = ["receipts", itemId];
  const { data: files = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("receipts").list(itemId);
      if (error) throw error;
      return data.filter((f) => f.name !== ".emptyFolderPlaceholder");
    },
  });

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    for (const f of Array.from(list)) {
      const safe = f.name.replace(/[^\w.\-]/g, "_");
      const { error } = await supabase.storage.from("receipts").upload(`${itemId}/${Date.now()}-${safe}`, f);
      if (error) toast.error(`Échec : ${f.name}`);
    }
    setBusy(false);
    qc.invalidateQueries({ queryKey: key });
  }
  async function open(name: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(`${itemId}/${name}`, 300);
    if (data) window.open(data.signedUrl, "_blank");
  }
  async function remove(name: string) {
    await supabase.storage.from("receipts").remove([`${itemId}/${name}`]);
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="mt-8 rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl">Factures et tickets</h2>
        <Button size="sm" disabled={busy} onClick={() => input.current?.click()}><Upload className="h-4 w-4" />{busy ? "Envoi…" : "Ajouter"}</Button>
        <input ref={input} type="file" accept="image/*,application/pdf" capture="environment" multiple hidden onChange={(e) => upload(e.target.files)} />
      </div>
      {files.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Prenez en photo votre ticket ou ajoutez une facture PDF.</p>
      ) : (
        <ul className="mt-4 divide-y">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-accent" />
              <button className="flex-1 truncate text-left hover:text-accent" onClick={() => open(f.name)}>{f.name.replace(/^\d+-/, "")}</button>
              <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => remove(f.name)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
