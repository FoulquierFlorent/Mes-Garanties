import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadItemPhotos } from "@/lib/item-photos";
import { Button } from "@/components/ui/button";

export function PhotoPicker({ files, onChange, disabled = false }: { files: File[]; onChange: (files: File[]) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  useEffect(() => {
    const next = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);
  return <div className="space-y-3">
    <Button type="button" variant="outline" disabled={disabled} onClick={() => input.current?.click()}><ImagePlus className="h-4 w-4" />Photos de l’objet</Button>
    <input ref={input} aria-label="Photos de l’objet" type="file" accept="image/*" multiple hidden disabled={disabled} onChange={(e) => { onChange([...files, ...Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"))]); e.target.value = ""; }} />
    {previews.length > 0 && <ul className="grid grid-cols-3 gap-2">{previews.map((p, i) => <li key={p.url} className="relative aspect-square overflow-hidden rounded-md border"><img src={p.url} alt={p.file.name} className="h-full w-full object-cover" /><Button type="button" variant="secondary" size="icon" className="absolute right-1 top-1" disabled={disabled} aria-label={`Retirer la photo ${p.file.name}`} onClick={() => onChange(files.filter((_, k) => k !== i))}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>}
  </div>;
}

export function ItemPhotos({ itemId }: { itemId: string }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const key = ["item-photos", itemId];
  const { data: photos = [], isError } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const storage = supabase.storage.from("item-photos");
      const { data, error } = await storage.list(itemId);
      if (error) throw error;
      return Promise.all(data.filter((f) => f.id).map(async (f) => {
        const { data: signed, error: signingError } = await storage.createSignedUrl(`${itemId}/${f.name}`, 3600);
        if (signingError) throw signingError;
        return { name: f.name, url: signed.signedUrl };
      }));
    },
    staleTime: 300000,
  });
  async function save() {
    setBusy(true);
    try {
      const failed = await uploadItemPhotos(itemId, pending);
      setPending(failed);
      await qc.invalidateQueries({ queryKey: key });
      if (failed.length) toast.error("Certaines photos n’ont pas pu être envoyées. Vous pouvez réessayer.");
      else toast.success("Photos enregistrées");
    } catch { toast.error("Envoi des photos impossible"); }
    finally { setBusy(false); }
  }
  async function remove(name: string) {
    const { error } = await supabase.storage.from("item-photos").remove([`${itemId}/${name}`]);
    if (error) { toast.error("Suppression impossible"); return; }
    await qc.invalidateQueries({ queryKey: key });
  }
  return <section className="mt-8 border-t py-6">
    <h2 className="mb-4 text-2xl">Photos de l’objet</h2>
    {isError && <p role="alert" className="mb-3 text-sm text-destructive">Impossible de charger les photos.</p>}
    {photos.length > 0 && <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((p) => <li key={p.name} className="relative aspect-square overflow-hidden rounded-md border"><a href={p.url} target="_blank" rel="noreferrer"><img src={p.url} alt="Photo de l’objet" className="h-full w-full object-cover" /></a><Button variant="secondary" size="icon" className="absolute right-1 top-1" aria-label="Supprimer la photo" onClick={() => remove(p.name)}><Trash2 className="h-4 w-4" /></Button></li>)}</ul>}
    <PhotoPicker files={pending} onChange={setPending} disabled={busy} />
    {pending.length > 0 && <Button className="mt-3" disabled={busy} onClick={save}>{busy ? "Envoi…" : "Enregistrer les photos"}</Button>}
  </section>;
}