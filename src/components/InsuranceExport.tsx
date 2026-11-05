import { useState } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { todayISO, type Item } from "@/lib/items";
import { makeInsurancePdf, type ReceiptFile } from "@/lib/insurance-pdf";

type Member = { user_id: string; display_name: string | null };

export function InsuranceExport({ items, members, owner }: { items: Item[]; members: Member[]; owner: string }) {
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<Blob | null>(null);

  const build = async () => {
    setBusy(true);
    try {
      const receipts: ReceiptFile[] = [];
      for (const it of items) {
        const { data } = await supabase.storage.from("receipts").list(it.id);
        for (const f of data ?? []) {
          if (f.name.endsWith(".ocr.txt")) continue;
          const { data: blob } = await supabase.storage.from("receipts").download(`${it.id}/${f.name}`);
          if (blob) receipts.push({ itemId: it.id, name: f.name, blob });
        }
      }
      const names = Object.fromEntries(members.map((m) => [m.user_id, m.display_name ?? "—"]));
      setReady(await makeInsurancePdf({ owner, items, names, today: todayISO(), receipts }));
    } catch {
      toast.error("Le dossier n'a pas pu être préparé.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!ready) return;
    const url = URL.createObjectURL(ready);
    const a = document.createElement("a");
    a.href = url; a.download = `dossier-assurance-${todayISO()}.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  return ready ? (
    <Button variant="outline" onClick={download}><FileDown /> Télécharger le dossier</Button>
  ) : (
    <Button variant="outline" onClick={build} disabled={busy || items.length === 0}>
      <FileDown /> {busy ? "Préparation…" : "Dossier assurance (PDF)"}
    </Button>
  );
}
