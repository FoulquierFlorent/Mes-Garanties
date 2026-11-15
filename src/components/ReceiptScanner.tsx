import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, FileText, Image as ImageIcon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { extractReceiptWithAi } from "@/lib/receipt-ai.functions";
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
  const [detected, setDetected] = useState<[string, string][] | null>(null);
  const extractAi = useServerFn(extractReceiptWithAi);

  function describe(fields: ScanFields): [string, string][] {
    const fr = (d?: string) => d && d.split("-").reverse().join("/");
    return ([
      ["Objet", fields.name], ["Marque", fields.brand], ["Magasin", fields.store],
      ["Date d'achat", fr(fields.purchase_date)], ["N° facture / commande", fields.order_number],
      ["Date de facture", fr(fields.order_date)], ["Prix", fields.price && `${fields.price.replace(".", ",")} €`],
      ["Catégorie", fields.category],
    ] as [string, string | undefined][]).filter((x): x is [string, string] => !!x[1]);
  }

  async function tryAi(file: File): Promise<ScanFields | null> {
    try {
      const dataUrl = file.type === "application/pdf" ? await toDataUrl(file) : await shrinkImage(file);
      if (dataUrl.length > 8_000_000) return null;
      const r = await extractAi({ data: { dataUrl, filename: file.name } });
      if (r.error) toast.message(r.error);
      return r.fields && Object.keys(r.fields).length ? r.fields : null;
    } catch {
      return null;
    }
  }

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
    setDetected(null);

    const ai = await tryAi(file);
    if (ai) {
      onResult(ai, file, "");
      setDetected(describe(ai));
      setFilled("Informations détectées par la lecture intelligente — vérifiez-les ci-dessous :");
      setBusy(false);
      clearInputs();
      return;
    }

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
        const parts = describe(fields);
        setDetected(parts.length ? parts : null);
        setFilled(parts.length ? "Informations détectées — vérifiez-les ci-dessous :" : "Aucune information reconnue : complétez la fiche à la main.");
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
      {busy && <p role="status" className="mt-2 text-sm text-muted-foreground">Lecture du justificatif…{progress ? ` ${progress} %` : ""}</p>}
      {filled && !busy && <p className="mt-2 text-sm text-success">{filled}</p>}
      {detected && !busy && (
        <dl aria-label="Informations détectées" className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-muted/60 p-2 text-sm">
          {detected.map(([k, v]) => (
            <div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd className="min-w-0 break-words font-medium">{v}</dd></div>
          ))}
        </dl>
      )}
      {extracted && !busy && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-muted-foreground">Voir le texte lu</summary>
          <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words font-sans text-xs">{extracted}</pre>
        </details>
      )}
    </div>
  );
}

function toDataUrl(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

/** Réduit la photo (1600 px max) pour l'envoyer rapidement à la lecture intelligente. */
async function shrinkImage(file: File): Promise<string> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } catch {
    return toDataUrl(file);
  }
}
