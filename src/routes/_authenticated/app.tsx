import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Bell, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, householdQuery, CATEGORIES, RETURN_LABELS, todayISO, fmt } from "@/lib/items";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALERT_OPTIONS, alertDate, firstYearReminder, daysLeft, status, warrantyEnd, itemWarranties, type AlertKey } from "@/lib/warranty";
import { WarrantyYearSelect } from "@/components/WarrantyYearSelect";
import { WarrantyMarker } from "@/components/WarrantyMarker";
import { PhotoPicker } from "@/components/ItemPhotos";
import { uploadItemPhotos } from "@/lib/item-photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserId } from "@/hooks/useUserId";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Mes objets — Garantia" }, { name: "description", content: "Vos objets et leurs garanties." }, { property: "og:title", content: "Mes objets — Garantia" }, { property: "og:description", content: "Vos objets et leurs garanties partagés avec votre foyer." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(itemsQuery), context.queryClient.ensureQueryData(householdQuery)]),
  component: AppPage,
});

function AddItem({ householdId }: { householdId: string | null }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState("Électronique");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", brand: "", store: "", purchase_date: todayISO(), warranty_months: 24 });
  const [alerts, setAlerts] = useState<AlertKey[]>(["1m"]);
  const [storeYears, setStoreYears] = useState<number | null>(null);
  const [brandYears, setBrandYears] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: async () => {
      let itemId = savedItemId;
      if (!itemId) {
        const { data, error } = await supabase.from("items").insert({ ...f, alerts, category, household_id: householdId, store_warranty_years: storeYears, brand_warranty_years: brandYears }).select("id").single();
        if (error) throw error;
        itemId = data.id;
        setSavedItemId(itemId);
      }
      const failed = await uploadItemPhotos(itemId, photos);
      setPhotos(failed);
      if (failed.length) throw new Error("photos");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setStoreYears(null);
      setBrandYears(null);
      setPhotos([]);
      setSavedItemId(null);
      setF({ name: "", brand: "", store: "", purchase_date: todayISO(), warranty_months: 24 });
      toast.success("Objet ajouté");
    },
    onError: (error) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.error(error.message === "photos" ? "Objet enregistré, mais certaines photos ont échoué. Réessayez l’envoi ou fermez pour les ajouter plus tard." : "Impossible d'ajouter l'objet");
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => { if (m.isPending) return; setOpen(next); if (!next && savedItemId) { setSavedItemId(null); setPhotos([]); setF({ name: "", brand: "", store: "", purchase_date: todayISO(), warranty_months: 24 }); setStoreYears(null); setBrandYears(null); } }}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Ajouter</Button></DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-2xl font-normal">Nouvel objet</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <fieldset disabled={m.isPending || savedItemId !== null} className="space-y-4">
          <div className="space-y-1.5"><Label>Nom</Label><Input required placeholder="Lave-linge" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Marque</Label><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Magasin</Label><Input value={f.store} onChange={(e) => setF({ ...f, store: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5"><Label>Date d'achat</Label><Input type="date" required value={f.purchase_date} onChange={(e) => setF({ ...f, purchase_date: e.target.value })} /></div>
          <WarrantyYearSelect id="primary-years" label="Garantie légale" warrantyKey="base" optional={false} value={f.warranty_months / 12} onChange={(y) => { if (y !== null) setF({ ...f, warranty_months: y * 12 }); }} />


          <div className="grid gap-3 sm:grid-cols-2">
            <WarrantyYearSelect id="store-years" label="Garantie magasin" warrantyKey="store" value={storeYears} onChange={setStoreYears} />
            <WarrantyYearSelect id="brand-years" label="Garantie de marque" warrantyKey="brand" value={brandYears} onChange={setBrandYears} />
          </div>
          <div className="space-y-2">
            <Label>Alertes</Label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked disabled />Fin de la première année</label>
            {ALERT_OPTIONS.map((o) => (
              <label key={o.key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={alerts.includes(o.key)} onCheckedChange={(c) => setAlerts(c ? [...alerts, o.key] : alerts.filter((a) => a !== o.key))} />
                {o.label}
              </label>
            ))}
          </div>
          </fieldset>
          <PhotoPicker files={photos} onChange={setPhotos} disabled={m.isPending} />
          <Button className="w-full" disabled={m.isPending}>{m.isPending ? "Enregistrement…" : savedItemId ? "Réessayer l’envoi des photos" : "Enregistrer"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AppPage() {
  const { data: allItems } = useSuspenseQuery(itemsQuery);
  const { data: household } = useSuspenseQuery(householdQuery);
  const me = useUserId();
  const [cat, setCat] = useState<string | null>(null);
  const items = cat ? allItems.filter((i) => i.category === cat) : allItems;
  const usedCats = CATEGORIES.filter((c) => allItems.some((i) => i.category === c));
  const qc = useQueryClient();
  const today = todayISO();
  const firstYearItems = items.filter((i) => firstYearReminder(i.purchase_date) === today);
  const del = async (id: string) => {
    await supabase.from("items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["items"] });
  };
  const upcoming = items.flatMap((i) => {
    return itemWarranties(i).flatMap((w) => (i.alerts as AlertKey[]).map((a) => ({ item: i, label: w.label, date: alertDate(w.end, a), end: w.end })))
      .filter((x) => x.date <= today && x.end >= today);
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl sm:text-5xl">{household ? household.name : "Mes objets"}</h1>
          {household && <p className="mt-1 text-sm text-muted-foreground">Partagé avec {household.members.length} personne(s)</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2"><Button asChild variant="outline" size="icon" aria-label="Calendrier des garanties" title="Calendrier des garanties"><Link to="/calendrier"><CalendarDays /></Link></Button><AddItem householdId={household?.id ?? null} /></div>
      </div>
      {usedCats.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {[null, ...usedCats].map((c) => (
            <Button key={c ?? "all"} size="sm" variant={cat === c ? "default" : "outline"} className="rounded-full" onClick={() => setCat(c)}>{c ?? "Toutes"}</Button>
          ))}
        </div>
      )}

      {(upcoming.length > 0 || firstYearItems.length > 0) && (
        <div className="mt-8 rounded-lg border border-accent/40 bg-accent/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4 text-accent" />Rappels de garantie</p>
          <ul className="mt-2 space-y-1 text-sm">
            {firstYearItems.map((i) => <li key={`${i.id}-first-year`}><Link to="/objet/$id" params={{ id: i.id }} className="hover:underline">{i.name} · Fin de la première année aujourd’hui</Link></li>)}
            {[...new Map(upcoming.map((u) => [u.item.id + u.label, u])).values()].map((u) => (
              <li key={u.item.id + u.label}>{u.item.name} · {u.label} — fin le {fmt(u.end)} ({daysLeft(u.end, today)} j)</li>
            ))}
          </ul>
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">Aucun objet pour l'instant. Ajoutez votre premier achat.</p>
      ) : (
        <ul className="mt-8 divide-y rounded-lg border bg-card">
          {items.map((i) => {
            const end = warrantyEnd(i.purchase_date, i.warranty_months);
            const s = status(end, today);
            return (
              <li key={i.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link to="/objet/$id" params={{ id: i.id }} className="font-medium hover:text-accent">{i.name} {i.brand && <span className="text-muted-foreground font-normal">· {i.brand}</span>}</Link>
                  {i.return_status !== "none" && <p className="text-xs text-warning">Retour : {RETURN_LABELS[i.return_status] ?? i.return_status}</p>}
                  <p className="text-xs uppercase tracking-wider text-accent">{i.category}
                    {household && me && i.user_id !== me && <span className="ml-2 normal-case tracking-normal text-muted-foreground">· ajouté par {household.members.find((m) => m.user_id === i.user_id)?.display_name?.trim() || "un membre"}</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">Fin de garantie : {fmt(end)}</p>
                  {itemWarranties(i).filter((w) => w.key !== "base").map((w) => <p key={w.key} className="text-xs text-muted-foreground">{w.label} : {fmt(w.end)}</p>)}
                </div>
                <Badge variant="outline" className={s === "expired" ? "text-destructive border-destructive/40" : s === "soon" ? "text-warning border-warning/50" : "text-success border-success/40"}>
                  {s === "expired" ? "Expirée" : s === "soon" ? `${daysLeft(end, today)} j` : "Active"}
                </Badge>
                <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => del(i.id)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
