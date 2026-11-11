import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@tanstack/react-router";
import { Lock, FileCheck } from "lucide-react";
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
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <FileCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Votre dossier assurance</p>
          <p className="mt-1 text-sm text-muted-foreground">Vos objets, factures et justificatifs réunis dans un seul document, utile en cas de vol, d’incendie ou de dégât des eaux.</p>
          <div className="mt-3">
            <Button disabled className="h-auto min-h-9 w-full max-w-full whitespace-normal px-3 py-2 text-center leading-snug"><Lock /> Télécharger mon dossier PDF</Button>
            <p className="mt-2 text-xs text-muted-foreground">Réservé aux offres Solo, Famille et Titane — <Link to="/tarifs" className="underline">voir les tarifs</Link>.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setReady(null); }}>
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        <FileCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-medium">Votre dossier assurance</p>
          <p className="mt-1 text-sm text-muted-foreground">Vos objets, factures et justificatifs réunis dans un seul document, utile en cas de vol, d’incendie ou de dégât des eaux.</p>
          <div className="mt-3">
            <DialogTrigger asChild>
              <Button disabled={items.length === 0} className="h-auto min-h-9 w-full max-w-full whitespace-normal px-3 py-2 text-center leading-snug"><FileDown /> Télécharger mon dossier PDF</Button>
            </DialogTrigger>
          </div>
        </div>
      </div>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b px-5 pb-4 pt-5 text-left">
          <Button type="button" variant="outline" className="mb-3 mr-8 min-h-11 w-fit" onClick={() => { setOpen(false); setReady(null); }}>
            <ArrowLeft /> Retour à l’application
          </Button>
          <DialogTitle>Dossier d'assurance</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-5">
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
            <Button className="h-auto min-h-9 w-full whitespace-normal py-2 leading-snug" onClick={download}><FileDown /> Télécharger le dossier ({ready.label})</Button>
          ) : (
            <Button className="w-full" onClick={build} disabled={busy || filtered.length === 0 || (mode === "year" && !year) || (mode === "range" && (!from || !to))}>
              {busy ? "Préparation…" : "Préparer le dossier"}
            </Button>
          )}
        </div>
        <div className="shrink-0 border-t bg-background p-4">
          <Button type="button" className="min-h-11 w-full" onClick={() => { setOpen(false); setReady(null); }}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
