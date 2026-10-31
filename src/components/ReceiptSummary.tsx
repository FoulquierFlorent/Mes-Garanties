import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { summarizeReceipts } from "@/lib/receipt-summary.functions";

export function ReceiptSummary({ itemId, summary }: { itemId: string; summary: string | null }) {
  const run = useServerFn(summarizeReceipts);
  const qc = useQueryClient();
  const [text, setText] = useState(summary);
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      const r = await run({ data: { itemId } });
      if (r.error) toast.error(r.error);
      else { setText(r.summary); qc.invalidateQueries({ queryKey: ["items"] }); }
    } catch { toast.error("Résumé indisponible pour le moment."); }
    setBusy(false);
  };
  return (
    <section className="mt-8 rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl"><Sparkles className="h-5 w-5 text-accent" />Résumé des tickets</h2>
        <Button size="sm" variant="outline" onClick={go} disabled={busy}>{busy ? "Résumé…" : text ? "Actualiser" : "Résumer"}</Button>
      </div>
      {text
        ? <div className="mt-3 whitespace-pre-line text-sm leading-relaxed">{text}</div>
        : <p className="mt-2 text-sm text-muted-foreground">Un résumé automatique de vos tickets et factures lus (magasin, date, prix, total).</p>}
    </section>
  );
}
