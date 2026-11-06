import { useState } from "react";
import { Archive, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob, fetchAuthenticatedExport } from "@/lib/authenticated-download";
import { todayISO } from "@/lib/items";

export function TitaneExports({ plan }: { plan: string }) {
  const [busy, setBusy] = useState<"zip" | "csv" | null>(null);
  if (plan !== "titane") return null;

  async function download(kind: "zip" | "csv") {
    setBusy(kind);
    try {
      const type = kind === "zip" ? "justificatifs-zip" : "comptable-csv";
      const blob = await fetchAuthenticatedExport(`/api/exports/${type}`);
      const filename = kind === "zip" ? `justificatifs-titane-${todayISO()}.zip` : `export-comptable-titane-${todayISO()}.csv`;
      downloadBlob(blob, filename);
      toast.success(kind === "zip" ? "ZIP des justificatifs téléchargé" : "CSV comptable téléchargé");
    } catch {
      toast.error("L’export n’a pas pu être préparé. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-label="Exports Mes garanties Titane" className="rounded-lg border bg-card p-4">
      <p className="text-sm font-medium">Exports pour votre expert-comptable</p>
      <p className="mt-1 text-xs text-muted-foreground">Retrouvez tous les justificatifs et le récapitulatif des achats du foyer.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy !== null} onClick={() => download("zip")}><Archive />{busy === "zip" ? "Préparation…" : "Justificatifs (ZIP)"}</Button>
        <Button variant="outline" disabled={busy !== null} onClick={() => download("csv")}><FileSpreadsheet />{busy === "csv" ? "Préparation…" : "Export comptable (CSV)"}</Button>
      </div>
    </section>
  );
}
