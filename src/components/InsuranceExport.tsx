import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { todayISO, type Item } from "@/lib/items";
import { filterItemsByPeriod, insuranceFileName } from "@/lib/insurance-pdf";
import { canExportInsurance } from "@/lib/plans";
import { downloadBlob, fetchAuthenticatedExport } from "@/lib/authenticated-download";

type Mode = "all" | "year" | "range";

export function InsuranceExport({ items, plan = "gratuit" }: { items: Item[]; plan?: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("all");
  const [year, setYear] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<{ blob: Blob; label: string } | null>(null);

  const years = useMemo(
    () => [...new Set(items.map((i) => i.purchase_date.slice(0, 4)))].sort().reverse(),
    [items],
  );

  const period = useMemo((): { from: string | null; to: string | null; label: string } => {
    if (mode === "year" && year) return { from: `${year}-01-01`, to: `${year}-12-31`, label: `Année ${year}` };
    if (mode === "range" && from && to) {
      const [a, b] = from <= to ? [from, to] : [to, from];
      const fmt = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("fr-FR");
      return { from: a, to: b, label: `Du ${fmt(a)} au ${fmt(b)}` };
    }
    return { from: null, to: null, label: "Toutes les dates" };
  }, [mode, year, from, to]);

  const filtered = useMemo(() => filterItemsByPeriod(items, period.from, period.to), [items, period]);

  const build = async () => {
    setBusy(true);
    try {
      const query = period.from && period.to ? `?from=${period.from}&to=${period.to}` : "";
      const blob = await fetchAuthenticatedExport(`/api/exports/assurance-pdf${query}`);
      setReady({ blob, label: period.label });
    } catch {
      toast.error("Le dossier n'a pas pu être préparé.");
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!ready) return;
    downloadBlob(ready.blob, insuranceFileName(plan, ready.label, todayISO()));
    setReady(null);
    setOpen(false);
  };

  const option = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => { setMode(m); setReady(null); }}
      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${mode === m ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-accent"}`}
    >
      {label}
    </button>
  );

  if (!canExportInsurance(plan)) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled><Lock /> Dossier assurance (PDF)</Button>
        <p className="text-sm text-muted-foreground">
          Réservé aux offres Solo, Famille et Titane — <Link to="/tarifs" className="underline">voir les tarifs</Link>.
        </p>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setReady(null); }}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={items.length === 0}><FileDown /> Dossier assurance (PDF)</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dossier d'assurance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Période couverte</Label>
            <div className="flex flex-wrap gap-2">
              {option("all", "Tout")}
              {option("year", "Une année")}
              {option("range", "Dates libres")}
            </div>
          </div>
          {mode === "year" && (
            <div>
              <Label htmlFor="assurance-year" className="mb-1 block">Année des achats</Label>
              <select
                id="assurance-year"
                value={year}
                onChange={(e) => { setYear(e.target.value); setReady(null); }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Choisir…</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          {mode === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="assurance-from" className="mb-1 block">Du</Label>
                <Input id="assurance-from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setReady(null); }} />
              </div>
              <div>
                <Label htmlFor="assurance-to" className="mb-1 block">Au</Label>
                <Input id="assurance-to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setReady(null); }} />
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {filtered.length} objet(s) inclus — {period.label}. Le dossier regroupe valeurs, garanties et justificatifs, avec une section pour les biens sans justificatif.
          </p>
          {ready ? (
            <Button className="w-full" onClick={download}><FileDown /> Télécharger le dossier ({ready.label})</Button>
          ) : (
            <Button className="w-full" onClick={build} disabled={busy || filtered.length === 0 || (mode === "year" && !year) || (mode === "range" && (!from || !to))}>
              {busy ? "Préparation…" : "Préparer le dossier"}
            </Button>
          )}
          <Button type="button" variant="outline" className="w-full" onClick={() => { setOpen(false); setReady(null); }}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
