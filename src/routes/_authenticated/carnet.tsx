import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, Wrench, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, todayISO, fmt, formatPrice } from "@/lib/items";
import { MAINTENANCE_KINDS, FREQUENCIES, suggestionsFor, entryStatus, addMonths, totals, type MaintenanceKind } from "@/lib/maintenance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const maintenanceQuery = queryOptions({
  queryKey: ["maintenance"],
  queryFn: async () => {
    const { data, error } = await supabase.from("maintenance_entries").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/_authenticated/carnet")({
  validateSearch: (s: Record<string, unknown>): { objet?: string } => (typeof s["objet"] === "string" ? { objet: s["objet"] } : {}),
  head: () => ({ meta: [{ title: "Carnet d’entretien — Mes garanties" }, { name: "description", content: "Historique des entretiens et réparations de vos objets." }, { property: "og:title", content: "Carnet d’entretien — Mes garanties" }, { property: "og:description", content: "Prenez soin de vos objets et conservez leur historique." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(itemsQuery), context.queryClient.ensureQueryData(maintenanceQuery)]),
  component: CarnetPage,
});

const STATUS = { retard: ["En retard", "bg-destructive"], bientot: ["Bientôt", "bg-warranty-extension"], programme: ["Programmé", "bg-warranty-brand"], fait: ["Effectué", "bg-warranty-repair"] } as const;

function CarnetPage() {
  const { objet } = Route.useSearch();
  const { data: items } = useSuspenseQuery(itemsQuery);
  const { data: entries } = useSuspenseQuery(maintenanceQuery);
  const qc = useQueryClient();
  const [open, setOpen] = useState(!!objet);
  const today = todayISO();
  const name = (id: string) => items.find((i) => i.id === id)?.name ?? "Objet";
  const scoped = objet ? entries.filter((e) => e.item_id === objet) : entries;
  const upcoming = scoped.filter((e) => e.next_date && e.next_date >= today).sort((a, b) => a.next_date!.localeCompare(b.next_date!));
  const late = scoped.filter((e) => entryStatus(e, today) === "retard");
  const history = scoped.filter((e) => e.done_date).sort((a, b) => b.done_date!.localeCompare(a.done_date!));
  const t = totals(scoped);

  const markDone = async (id: string, freq: number | null) => {
    const e = entries.find((x) => x.id === id)!;
    await supabase.from("maintenance_entries").update({ done_date: today, next_date: null }).eq("id", id);
    if (freq && window.confirm("Programmer le prochain entretien ?")) {
      await supabase.from("maintenance_entries").insert({ item_id: e.item_id, kind: e.kind, title: e.title, next_date: addMonths(today, freq), frequency_months: freq, provider: e.provider });
    }
    qc.invalidateQueries({ queryKey: ["maintenance"] });
  };

  const Row = ({ e }: { e: (typeof entries)[number] }) => {
    const [label, color] = STATUS[entryStatus(e, today)];
    return (
      <li className="rounded-lg border bg-card p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 font-medium">{e.title}</span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>
        </div>
        <Link to="/objet/$id" params={{ id: e.item_id }} className="text-xs text-accent hover:underline">{name(e.item_id)}</Link>
        <p className="text-xs text-muted-foreground">
          {MAINTENANCE_KINDS[e.kind as MaintenanceKind] ?? e.kind}
          {e.done_date && ` · fait le ${fmt(e.done_date)}`}{e.next_date && ` · prévu le ${fmt(e.next_date)}`}
          {e.amount != null && ` · ${formatPrice(Number(e.amount))}`}{e.provider && ` · ${e.provider}`}
        </p>
        {e.next_date && <Button size="sm" variant="outline" className="mt-2" onClick={() => markDone(e.id, e.frequency_months)}>Marquer comme effectué</Button>}
      </li>
    );
  };
  const Section = ({ title, list, empty }: { title: string; list: typeof entries; empty: string }) => (
    <section className="mt-8"><h2 className="text-xl">{title}</h2>{list.length ? <ul className="mt-3 space-y-2">{list.map((e) => <Row key={e.id} e={e} />)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{empty}</p>}</section>
  );

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Button asChild variant="outline" size="sm" className="rounded-full"><Link to="/app">← Objets</Link></Button>
      <h1 className="mt-6 flex items-center gap-3 text-4xl sm:text-5xl"><span className="relative"><BookOpen className="h-9 w-9 text-accent" /><Wrench className="absolute -bottom-1 -right-1 h-4 w-4 text-accent" /></span>Carnet d’entretien</h1>
      <p className="mt-2 text-muted-foreground">Prenez soin de vos objets, prolongez leur durée de vie et conservez leur historique.</p>
      {objet && <p className="mt-2 text-sm">Objet : <strong>{name(objet)}</strong> · <Link to="/carnet" search={{}} className="text-accent hover:underline">Voir tous les objets</Link></p>}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Entretien", t.maintenance], ["Réparations", t.repair], ["Total payé", t.paid], ["Pris en charge", t.covered]].map(([l, v]) => (
          <div key={l as string} className="rounded-lg border bg-card p-3"><p className="text-xs text-muted-foreground">{l}</p><p className="text-lg font-medium">{formatPrice(v as number)}</p></div>
        ))}
      </div>
      <Button className="mt-6" onClick={() => setOpen((o) => !o)}><Plus />Ajouter une intervention</Button>
      {open && <AddForm items={items} defaultItem={objet} onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["maintenance"] }); }} />}
      <Section title="En retard" list={late} empty="Aucun entretien en retard." />
      <Section title="Prochains entretiens" list={upcoming} empty="Aucun entretien programmé." />
      <Section title="Historique des interventions" list={history} empty="Aucune intervention enregistrée." />
    </main>
  );
}

function AddForm({ items, defaultItem, onDone }: { items: { id: string; name: string; category: string }[]; defaultItem?: string | undefined; onDone: () => void }) {
  const [f, setF] = useState({ item_id: defaultItem ?? items[0]?.id ?? "", kind: "courant", title: "", done_date: todayISO(), next_date: "", freq: "", description: "", provider: "", pro: true, amount: "", covered: "", parts: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const item = items.find((i) => i.id === f.item_id);
  const num = (s: string) => (s.trim() ? Number(s.replace(",", ".")) : null);
  const submit = async (): Promise<void> => {
    if (!f.item_id || !f.title.trim()) { toast.error("Choisissez un objet et indiquez l’intervention."); return; }
    setSaving(true);
    const freq = f.freq ? Number(f.freq) : null;
    const next = f.next_date || (freq && f.done_date ? addMonths(f.done_date, freq) : null);
    const { error } = await supabase.from("maintenance_entries").insert({
      item_id: f.item_id, kind: f.kind, title: f.title.trim(), done_date: f.done_date || null, next_date: next, frequency_months: freq,
      description: f.description || null, provider: f.provider || null, by_professional: f.pro, amount: num(f.amount), covered_amount: num(f.covered), parts: f.parts || null, notes: f.notes || null,
    });
    setSaving(false);
    if (error) { toast.error("Enregistrement impossible."); return; }
    toast.success("Intervention enregistrée"); onDone();
  };
  const sel = "h-10 w-full rounded-md border bg-background px-3 text-sm";
  return (
    <div className="mt-4 space-y-3 rounded-lg border bg-card p-4">
      <div><Label>Objet *</Label><select className={sel} value={f.item_id} onChange={(e) => set("item_id", e.target.value)}>{items.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
      <div><Label>Type *</Label><select className={sel} value={f.kind} onChange={(e) => set("kind", e.target.value)}>{Object.entries(MAINTENANCE_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
      <div><Label>Intervention *</Label><Input value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex. Détartrage" />
        {item && <div className="mt-2 flex flex-wrap gap-1.5">{suggestionsFor(item.category).map((s) => <button key={s} type="button" onClick={() => set("title", s)} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted">{s}</button>)}</div>}
        <p className="mt-1 text-xs text-muted-foreground">Suggestions indicatives : la fréquence dépend du fabricant, du modèle ou de la réglementation. Consultez la notice.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><Label>Date de l’intervention</Label><Input type="date" value={f.done_date} onChange={(e) => set("done_date", e.target.value)} /></div>
        <div><Label>Prochain entretien</Label><Input type="date" value={f.next_date} onChange={(e) => set("next_date", e.target.value)} /></div>
        <div><Label>Répéter</Label><select className={sel} value={f.freq} onChange={(e) => set("freq", e.target.value)}><option value="">Pas de répétition</option>{FREQUENCIES.map((q) => <option key={q.v} value={q.v}>{q.l}</option>)}</select></div>
        <div><Label>Réalisé par</Label><select className={sel} value={f.pro ? "1" : "0"} onChange={(e) => set("pro", e.target.value === "1")}><option value="1">Un professionnel</option><option value="0">Moi-même</option></select></div>
        <div><Label>Professionnel / réparateur</Label><Input value={f.provider} onChange={(e) => set("provider", e.target.value)} /></div>
        <div><Label>Montant payé (€)</Label><Input inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} /></div>
        <div><Label>Pris en charge par une garantie (€)</Label><Input inputMode="decimal" value={f.covered} onChange={(e) => set("covered", e.target.value)} /></div>
        <div><Label>Pièces remplacées</Label><Input value={f.parts} onChange={(e) => set("parts", e.target.value)} /></div>
      </div>
      <div><Label>Description</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div><Label>Commentaires personnels</Label><Textarea value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
      <Button onClick={submit} disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
    </div>
  );
}
