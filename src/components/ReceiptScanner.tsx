import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseReceipt, readReceiptText, type ScanFields } from "@/lib/scan";

type Props = {
  onResult: (fields: ScanFields, file: File, text: string) => void;
  disabled?: boolean;
};

/** Scanner de justificatif : ticket photographié, capture d'écran ou facture PDF. */
export function ReceiptScanner({ onResult, disabled }: Props) {
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const pdf = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extracted, setExtracted] = useState<string | null>(null);
  const [filled, setFilled] = useState<string | null>(null);

  function clearInputs() {
    for (const r of [camera, gallery, pdf]) if (r.current) r.current.value = "";
  }

  async function handle(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setBusy(true);
    setProgress(0);
    setExtracted(null);
    setFilled(null);

    if (file.type === "application/pdf") {
      onResult({}, file, "");
      setFilled("Facture jointe : elle sera rangée dans la fiche de l'objet.");
      toast.info("Facture PDF jointe : son contenu ne peut pas être lu automatiquement.");
      setBusy(false);
      clearInputs();
      return;
    }

    try {
      const text = await readReceiptText(file, setProgress);
      if (!text.trim()) {
        toast.error("Justificatif illisible : essayez une photo plus nette.");
        setFilled("Aucun texte reconnu : complétez la fiche à la main.");
      } else {
        const fields = parseReceipt(text);
        onResult(fields, file, text);
        setExtracted(text.slice(0, 1500));
        const parts = [
          fields.name && `nom : ${fields.name}`,
          fields.brand && `marque : ${fields.brand}`,
          fields.store && `magasin : ${fields.store}`,
          fields.purchase_date && `date : ${fields.purchase_date}`,
          fields.category && `catégorie : ${fields.category}`,
        ].filter(Boolean);
        setFilled(parts.length ? `Renseigné automatiquement — ${parts.join(" · ")}` : "Aucune information reconnue : complétez la fiche à la main.");
      }
    } catch {
      toast.error("Lecture impossible. Vous pouvez compléter la fiche à la main.");
      setFilled("Lecture impossible : complétez la fiche à la main.");
    } finally {
      setBusy(false);
      clearInputs();
    }
  }

  return (
    <div className="rounded-lg border border-dashed p-3">
      <p className="text-sm font-medium">Scanner un justificatif</p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Ticket de caisse photographié, capture d'écran ou facture PDF : le texte est lu et la fiche est remplie.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={busy || disabled} onClick={() => camera.current?.click()}>
          <Camera className="h-4 w-4" />Ticket
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy || disabled} onClick={() => gallery.current?.click()}>
          <ImageIcon className="h-4 w-4" />Galerie
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={busy || disabled} onClick={() => pdf.current?.click()}>
          <FileText className="h-4 w-4" />Facture PDF
        </Button>
      </div>
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handle(e.target.files)} aria-label="Scanner un ticket de caisse" />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files)} aria-label="Choisir une capture dans la galerie" />
      <input ref={pdf} type="file" accept="application/pdf" hidden onChange={(e) => handle(e.target.files)} aria-label="Ajouter une facture PDF" />
      {busy && <p role="status" className="mt-2 text-sm text-muted-foreground">Lecture du justificatif… {progress} %</p>}
      {filled && !busy && <p className="mt-2 text-sm text-success">{filled}</p>}
      {extracted && !busy && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">Voir le texte lu</summary>
          <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-sans text-xs">{extracted}</pre>
        </details>
      )}
    </div>
  );
}
