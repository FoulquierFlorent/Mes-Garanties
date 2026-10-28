import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Camera, Image as ImageIcon, ScanText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function Receipts({ itemId }: { itemId: string }) {
  const qc = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<{ name: string; text: string } | null>(null);
  const key = ["receipts", itemId];
  const { data: files = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("receipts").list(itemId);
      if (error) throw error;
      return data.filter((f) => f.name !== ".emptyFolderPlaceholder" && !f.name.endsWith(".ocr.txt"));
    },
  });

  async function upload(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    for (const f of Array.from(list)) {
      const safe = f.name.replace(/[^\w.\-]/g, "_");
      const name = `${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("receipts").upload(`${itemId}/${name}`, f);
      if (error) toast.error(`Échec : ${f.name}`);
      else if (f.type.startsWith("image/")) await readPhoto(name, f);
    }
    setBusy(false);
    qc.invalidateQueries({ queryKey: key });
    if (input.current) input.current.value = "";
    if (galleryInput.current) galleryInput.current.value = "";
  }
  async function readPhoto(name: string, photo?: Blob) {
    setReading(name);
    setProgress(0);
    let worker: Awaited<ReturnType<typeof import("tesseract.js")["createWorker"]>> | undefined;
    try {
      const { data: saved } = await supabase.storage.from("receipts").download(`${itemId}/${name}.ocr.txt`);
      if (saved) { setPreview({ name, text: await saved.text() }); return; }
      const blob = photo ?? (await supabase.storage.from("receipts").download(`${itemId}/${name}`)).data;
      if (!blob) throw new Error("Photo inaccessible");
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("fra", 1, { logger: (m) => { if (m.status === "recognizing text") setProgress(Math.round(m.progress * 100)); } });
      const { data } = await worker.recognize(blob);
      const text = data.text.trim();
      if (!text) { toast.error("Ticket illisible : essayez une photo plus nette."); return; }
      const { error } = await supabase.storage.from("receipts").upload(`${itemId}/${name}.ocr.txt`, new Blob([text], { type: "text/plain;charset=utf-8" }));
      if (error) toast.error("Texte lu, mais son classement a échoué.");
      setPreview({ name, text });
    } catch {
      toast.error("Lecture impossible. La photo reste disponible ; vous pouvez réessayer.");
    } finally {
      await worker?.terminate();
      setReading(null);
    }
  }
  async function open(name: string) {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(`${itemId}/${name}`, 300);
    if (data) window.open(data.signedUrl, "_blank");
  }
  async function remove(name: string) {
    const { error } = await supabase.storage.from("receipts").remove([`${itemId}/${name}`, `${itemId}/${name}.ocr.txt`]);
    if (error) { toast.error("Suppression impossible"); return; }
    if (preview?.name === name) setPreview(null);
    qc.invalidateQueries({ queryKey: key });
  }

  return (
    <section className="mt-8 border-t py-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl">Factures et tickets</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" disabled={busy || reading !== null} onClick={() => input.current?.click()}><Camera className="h-4 w-4" />{busy ? "Envoi…" : "Photo"}</Button>
          <Button size="sm" variant="outline" disabled={busy || reading !== null} onClick={() => galleryInput.current?.click()}><ImageIcon className="h-4 w-4" />Galerie</Button>
        </div>
        <input ref={input} type="file" accept="image/*,application/pdf" capture="environment" multiple hidden onChange={(e) => upload(e.target.files)} aria-label="Prendre une photo du ticket" />
        <input ref={galleryInput} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => upload(e.target.files)} aria-label="Choisir dans la galerie" />
      </div>
      {files.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Prenez en photo votre ticket, ajoutez une facture PDF ou choisissez une capture d'écran dans votre galerie.</p>
      ) : (
        <ul className="mt-4 divide-y">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 py-2 text-sm">
              <FileText className="h-4 w-4 text-accent" />
              <Button variant="link" className="min-w-0 flex-1 justify-start p-0" onClick={() => open(f.name)}><span className="truncate">{f.name.replace(/^\d+-/, "")}</span></Button>
              {/\.(jpe?g|png|webp|bmp)$/i.test(f.name) && <Button variant="ghost" size="icon" title="Lire le ticket" aria-label={`Lire le ticket ${f.name.replace(/^\d+-/, "")}`} disabled={busy || reading !== null} onClick={() => readPhoto(f.name)}><ScanText /></Button>}
              <Button variant="ghost" size="icon" aria-label="Supprimer" disabled={busy || reading !== null} onClick={() => remove(f.name)}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
      {reading && <p role="status" className="mt-4 text-sm text-muted-foreground">Lecture du ticket… {progress} %</p>}
      {preview && <div className="mt-5 border-t pt-4"><div className="flex items-center justify-between gap-2"><h3 className="text-xl">Texte du ticket</h3><Button size="sm" variant="ghost" onClick={() => setPreview(null)}>Fermer</Button></div><p className="mt-1 break-words text-xs text-muted-foreground">{preview.name.replace(/^\d+-/, "")}</p><pre className="mt-3 max-h-80 overflow-y-auto whitespace-pre-wrap break-words font-sans text-sm">{preview.text}</pre></div>}
    </section>
  );
}
