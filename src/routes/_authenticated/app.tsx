import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Bell, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, householdQuery, CATEGORIES, CATEGORY_TYPES, RETURN_LABELS, todayISO, fmt, formatPrice } from "@/lib/items";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALERT_OPTIONS, alertDate, firstYearReminder, daysLeft, status, itemWarranties, type AlertKey } from "@/lib/warranty";
import { WarrantyYearSelect } from "@/components/WarrantyYearSelect";
import { WarrantyMarker } from "@/components/WarrantyMarker";
import { PhotoPicker } from "@/components/ItemPhotos";
import { uploadItemPhotos } from "@/lib/item-photos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserId } from "@/hooks/useUserId";
import { memberBorderClass } from "@/lib/members";
import { categoryImage } from "@/lib/category-images";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { Rubrique } from "@/components/Rubrique";
import { uploadReceipt } from "@/lib/receipt-upload";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Mes objets — Mes garanties" }, { name: "description", content: "Vos objets et leurs garanties." }, { property: "og:title", content: "Mes objets — Mes garanties" }, { property: "og:description", content: "Vos objets et leurs garanties partagés avec votre foyer." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(itemsQuery), context.queryClient.ensureQueryData(householdQuery)]),
  component: AppPage,
});

function AddItem({ householdId }: { householdId: string | null }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState("Électronique");
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [f, setF] = useState({ name: "", brand: "", store: "", price: "", purchase_date: todayISO(), warranty_months: 24 });
  const [alerts, setAlerts] = useState<AlertKey[]>(["1m"]);
  const [storeYears, setStoreYears] = useState<number | null>(null);
  const [brandYears, setBrandYears] = useState<number | null>(null);
  const [constructorYears, setConstructorYears] = useState<number | null>(null);
  const [extensionYears, setExtensionYears] = useState<number | null>(null);
  const [repairYears, setRepairYears] = useState<number | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [savedItemId, setSavedItemId] = useState<string | null>(null);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanText, setScanText] = useState("");
  const m = useMutation({
    mutationFn: async () => {
      let itemId = savedItemId;
      if (!itemId) {
        const { data, error } = await supabase.from("items").insert({ ...f, price: f.price.trim() ? Number(f.price.replace(",", ".")) : null, alerts, category, household_id: householdId, store_warranty_years: storeYears, brand_warranty_years: brandYears, constructor_warranty_years: constructorYears, extension_warranty_years: extensionYears, repair_warranty_years: repairYears }).select("id").single();
        if (error) throw error;
        itemId = data.id;
        setSavedItemId(itemId);
        if (scanFile) {
          try {
            await uploadReceipt(itemId, scanFile, scanText);
          } catch {
            toast.error("Justificatif non joint : vous pouvez le rajouter depuis la fiche de l'objet.");
          }
        }
      }
      const failed = await uploadItemPhotos(itemId, photos);
      setPhotos(failed);
      if (failed.length) throw new Error("photos");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      setOpen(false);
      setDetailsOpen(false);
      setStoreYears(null);
      setBrandYears(null);
      setConstructorYears(null);
      setExtensionYears(null);
      setRepairYears(null);
      setPhotos([]);
      setSavedItemId(null);
      setScanFile(null);
      setScanText("");
      setF({ name: "", brand: "", store: "", price: "", purchase_date: todayISO(), warranty_months: 24 });
      toast.success("Objet ajouté");
    },
    onError: (error) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      if (error.message === "photos") { setDetailsOpen(true); toast.error("Objet enregistré, mais certaines photos ont échoué. Réessayez l’envoi ou fermez pour les ajouter plus tard."); } else { toast.error("Impossible d'ajouter l'objet"); }
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => { if (m.isPending) return; setOpen(next); if (!next && savedItemId) { setSavedItemId(null); setPhotos([]); setScanFile(null); setScanText(""); setF({ name: "", brand: "", store: "", price: "", purchase_date: todayISO(), warranty_months: 24 }); setStoreYears(null); setBrandYears(null); setConstructorYears(null); setExtensionYears(null); setRepairYears(null); setDetailsOpen(false); } }}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Ajouter</Button></DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-2xl font-normal">Nouvel objet</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <ReceiptScanner
            disabled={m.isPending}
            onResult={(fields, file, text) => {
              setScanFile(file);
              setScanText(text);
              setF((prev) => ({
                ...prev,
                name: fields.name || prev.name,
                brand: fields.brand || prev.brand,
                store: fields.store || prev.store,
                purchase_date: fields.purchase_date || prev.purchase_date,
                warranty_months: prev.warranty_months,
              }));
              if (fields.category) setCategory(fields.category);
            }}
          />
          <fieldset disabled={m.isPending || savedItemId !== null} className="space-y-4">
          <div className="space-y-1.5"><Label>Nom</Label><Input required placeholder="Lave-linge" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => { const img = categoryImage(c); return <SelectItem key={c} value={c} textValue={c} className="gap-2"><span className="flex items-center gap-2">{img && <img src={img} alt="" loading="lazy" width={20} height={20} className="h-5 w-5 shrink-0 rounded object-cover" />}{c}</span></SelectItem>; })}</SelectContent>
            </Select>
            {(CATEGORY_TYPES[category] ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Type d’objet">
                {(CATEGORY_TYPES[category] ?? []).map((t) => (
                  <button key={t} type="button" onClick={() => setF({ ...f, name: t })} className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${f.name === t ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{t}</button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5"><Label>Date d'achat</Label><Input type="date" required value={f.purchase_date} onChange={(e) => setF({ ...f, purchase_date: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">Garantie légale : 2 ans par défaut pour tout achat. Modifiez-la dans les détails facultatifs.</p>
          </fieldset>
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-left text-sm hover:bg-muted">
              <span className="flex flex-col"><span className="font-medium">Détails facultatifs</span><span className="text-xs font-normal text-muted-foreground">marque, magasin, prix, garanties, alertes, photos</span></span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${detailsOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-4">
              <fieldset disabled={m.isPending || savedItemId !== null} className="space-y-4">
                <WarrantyYearSelect id="primary-years" label="Garantie légale" warrantyKey="base" optional={false} value={f.warranty_months / 12} onChange={(y) => { if (y !== null) setF({ ...f, warranty_months: y * 12 }); }} />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Marque</Label><Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Magasin</Label><Input value={f.store} onChange={(e) => setF({ ...f, store: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Prix (€, facultatif)</Label><Input type="number" min="0" step="0.01" inputMode="decimal" placeholder="ex. 49,90" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <WarrantyYearSelect id="store-years" label="Garantie magasin" warrantyKey="store" value={storeYears} onChange={setStoreYears} />
                  <WarrantyYearSelect id="brand-years" label="Garantie de marque" warrantyKey="brand" value={brandYears} onChange={setBrandYears} />
                  <WarrantyYearSelect id="constructor-years" label="Garantie constructeur" warrantyKey="constructor" value={constructorYears} onChange={setConstructorYears} />
                  <WarrantyYearSelect id="extension-years" label="Garantie d’extension" warrantyKey="extension" value={extensionYears} onChange={setExtensionYears} />
                  <WarrantyYearSelect id="repair-years" label="Garantie de réparation" warrantyKey="repair" value={repairYears} onChange={setRepairYears} />
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
            </CollapsibleContent>
          </Collapsible>
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
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl">{household ? household.name : "Mes objets"}</h1>
          {household && <p className="mt-1 text-sm text-muted-foreground">Partagé avec {household.members.length} personne(s)</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2"><Button asChild variant="outline" size="icon" aria-label="Calendrier des garanties" title="Calendrier des garanties"><Link to="/calendrier"><CalendarDays /></Link></Button><AddItem householdId={household?.id ?? null} /></div>
      </div>
      <RightBanner variant="whisper" offset={6} className="mt-4" />
      {usedCats.length > 0 && (cat === null ? (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Choisir une catégorie</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {usedCats.map((c) => (
              <button key={c} type="button" onClick={() => setCat(c)} className="group overflow-hidden rounded-lg border text-left transition-colors hover:border-primary">
                <img src={categoryImage(c) ?? ""} alt="" loading="lazy" width={120} height={64} className="h-14 w-full object-cover" />
                <span className="block truncate px-2 pt-1 text-xs font-medium">{c}</span>
                <span className="block px-2 pb-1.5 text-[11px] text-muted-foreground">{allItems.filter((i) => i.category === c).length} objet(s)</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setCat(null)}>← Toutes les catégories</Button>
          <span className="flex items-center gap-1.5 text-sm font-medium"><img src={categoryImage(cat) ?? ""} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full object-cover" />{cat} · {items.length}</span>
        </div>
      ))}

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

      <RightBanner offset={0} className="mt-8" />
      {items.length === 0 ? (
        <p className="mt-16 text-center text-muted-foreground">Aucun objet pour l'instant. Ajoutez votre premier achat.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((i) => {
            const catImg = categoryImage(i.category);
            return (
              <li key={i.id} className={`rounded-lg border-2 bg-card p-4 ${memberBorderClass(i.user_id)}`}>
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link to="/objet/$id" params={{ id: i.id }} className="font-medium hover:text-accent">{i.name} {i.brand && <span className="text-muted-foreground font-normal">· {i.brand}</span>}</Link>
                    {i.return_status !== "none" && <p className="text-xs text-warning">Retour : {RETURN_LABELS[i.return_status] ?? i.return_status}</p>}
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent">{catImg && <img src={catImg} alt="" loading="lazy" width={14} height={14} className="h-3.5 w-3.5 rounded object-cover" />}{i.category}
                      {i.price != null && <span className="ml-2 normal-case tracking-normal text-muted-foreground">· {formatPrice(i.price)}</span>}
                      {household && me && i.user_id !== me && <span className="ml-2 normal-case tracking-normal text-muted-foreground">· ajouté par {household.members.find((m) => m.user_id === i.user_id)?.display_name?.trim() || "un membre"}</span>}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => del(i.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-3 space-y-1.5 rounded-md border border-border/60 bg-muted/40 px-3 py-2.5">
                  {itemWarranties(i).map((w) => {
                    const ws = status(w.end, today);
                    const d = daysLeft(w.end, today);
                    return (
                      <p key={w.key} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        <WarrantyMarker warrantyKey={w.key} />
                        <span className="min-w-0 flex-1 truncate">{w.label}</span>
                        <span className="flex w-full items-center gap-2 pl-8 sm:w-auto sm:pl-0">
                          <span className="text-muted-foreground tabular-nums">jusqu’au {fmt(w.end)}</span>
                          <span className={`inline-flex h-4 shrink-0 items-center rounded-md px-1.5 text-[10px] font-semibold tabular-nums ${ws === "expired" ? "bg-destructive/10 text-destructive" : ws === "soon" ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                            {ws === "expired" ? "Expirée" : ws === "soon" ? `${d} j` : "Active"}
                          </span>
                        </span>
                      </p>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
