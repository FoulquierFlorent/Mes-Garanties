import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { buildInventoryCsv } from "@/lib/inventory-csv";
import { QUICK_FILTERS, applyQuickFilter, protectedValue, sortByDeadline, type QuickFilter } from "@/lib/deadlines";
import { toast } from "sonner";
import { Plus, Trash2, Bell, CalendarDays, Search, ShieldCheck, MoreHorizontal } from "lucide-react";
import { isArchived, matchesSearch } from "@/lib/deadlines";
import { supabase } from "@/integrations/supabase/client";
import { canAddItem, FREE_ITEM_LIMIT } from "@/lib/plans";
import { itemsQuery, householdQuery, CATEGORIES, CATEGORY_TYPES, RETURN_LABELS, todayISO, fmt, formatPrice } from "@/lib/items";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALERT_OPTIONS, alertDate, firstYearReminder, daysLeft, status, itemWarranties, type AlertKey } from "@/lib/warranty";
import { WarrantyYearSelect } from "@/components/WarrantyYearSelect";
import { itemCoverage, StatusBadge } from "@/components/HouseholdUi";
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
import { InsuranceExport } from "@/components/InsuranceExport";
import { TitaneExports } from "@/components/TitaneExports";
import { Rubrique } from "@/components/Rubrique";
import { uploadReceipt } from "@/lib/receipt-upload";
import { CategoryPicker } from "@/components/CategoryPicker";
import { DEFAULT_LEGAL_CONTEXT, estimateLegalWarranty, type ItemCondition, type LegalContext, type PurchaseCountry, type SellerType } from "@/lib/legal-warranty";

function LegalSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>
    <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="h-10 px-2 text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent></Select></div>;
}

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Mes objets — Mes garanties" }, { name: "description", content: "Vos objets et leurs garanties." }, { property: "og:title", content: "Mes objets — Mes garanties" }, { property: "og:description", content: "Vos objets et leurs garanties partagés avec votre foyer." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(itemsQuery), context.queryClient.ensureQueryData(householdQuery)]),
  component: AppPage,
});

function AddItem({ householdId, blocked = false }: { householdId: string | null; blocked?: boolean }) {
  const qc = useQueryClient();
  const [category, setCategory] = useState("Électronique");
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [f, setF] = useState({ name: "", brand: "", store: "", price: "", purchase_date: todayISO(), order_number: "", order_date: "", warranty_months: 24 });
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
  const [review, setReview] = useState<string[] | null>(null);
  const [mode, setMode] = useState<"scan" | "manuel">("scan");
  const [legal, setLegal] = useState<LegalContext>(DEFAULT_LEGAL_CONTEXT);
  const estimate = estimateLegalWarranty(legal);
  const applyLegal = (next: LegalContext) => { setLegal(next); const e = estimateLegalWarranty(next); if (e.months !== null) setF((prev) => ({ ...prev, warranty_months: e.months as number })); };
  const m = useMutation({
    mutationFn: async () => {
      let itemId = savedItemId;
      if (!itemId) {
        const { data, error } = await supabase.from("items").insert({ ...f, order_number: f.order_number.trim() || null, order_date: f.order_date || null, price: f.price.trim() ? Number(f.price.replace(",", ".")) : null, alerts, category, household_id: householdId, store_warranty_years: storeYears, brand_warranty_years: brandYears, constructor_warranty_years: constructorYears, extension_warranty_years: extensionYears, repair_warranty_years: repairYears }).select("id").single();
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
      setReview(null);
      setMode("scan");
      setLegal(DEFAULT_LEGAL_CONTEXT);
      setF({ name: "", brand: "", store: "", price: "", purchase_date: todayISO(), order_number: "", order_date: "", warranty_months: 24 });
      toast.success("Objet ajouté");
    },
    onError: (error) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      if (error.message === "photos") { setDetailsOpen(true); toast.error("Objet enregistré, mais certaines photos ont échoué. Réessayez l’envoi ou fermez pour les ajouter plus tard."); } else { toast.error(error.message.includes("free_plan_limit") ? `L’offre Gratuit est limitée à ${FREE_ITEM_LIMIT} objets. Passez à Solo ou Famille pour en ajouter d’autres.` : "Impossible d'ajouter l'objet"); }
    },
  });
  return (
    <Dialog open={open} onOpenChange={(next) => { if (m.isPending) return; setOpen(next); if (!next && savedItemId) { setSavedItemId(null); setPhotos([]); setScanFile(null); setScanText(""); setReview(null); setF({ name: "", brand: "", store: "", price: "", purchase_date: todayISO(), order_number: "", order_date: "", warranty_months: 24 }); setStoreYears(null); setBrandYears(null); setConstructorYears(null); setExtensionYears(null); setRepairYears(null); setDetailsOpen(false); } }}>
      {blocked ? <Button onClick={() => toast.error(`L’offre Gratuit est limitée à ${FREE_ITEM_LIMIT} objets.`, { action: { label: "Voir les offres", onClick: () => { window.location.href = "/tarifs"; } } })}><Plus className="h-4 w-4" />Ajouter un objet</Button> : <DialogTrigger asChild><Button><Plus className="h-4 w-4" />Ajouter un objet</Button></DialogTrigger>}
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-serif text-2xl font-normal">Nouvel objet</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); m.mutate(); }}>
          <div role="tablist" aria-label="Mode d’ajout" className="grid grid-cols-2 rounded-lg bg-muted p-1 text-sm">
            {(["scan", "manuel"] as const).map((k) => (
              <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} className={`h-10 rounded-md transition-colors ${mode === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}>{k === "scan" ? "Ajout intelligent" : "Ajout manuel"}</button>
            ))}
          </div>
          {mode === "scan" && <ReceiptScanner
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
                order_number: fields.order_number || prev.order_number,
                order_date: fields.order_date || prev.order_date,
                price: fields.price || prev.price,
                warranty_months: prev.warranty_months,
              }));
              if (fields.category) setCategory(fields.category);
              if (fields.brand || fields.store || fields.price || fields.order_number) setDetailsOpen(true);
              const missing = [!fields.name && "nom de l’objet", !fields.purchase_date && "date d’achat", !fields.order_number && "n° de facture", !fields.price && "prix"].filter(Boolean) as string[];
              setReview(missing);
            }}
          />}
          {review && !savedItemId && (
            <div role="note" className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm">
              <p className="font-medium">Vérifiez la fiche avant de l’enregistrer</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Les informations lues sur le ticket peuvent contenir des erreurs : corrigez chaque champ si besoin.{review.length ? ` Non trouvé : ${review.join(", ")}.` : ""}</p>
            </div>
          )}
          <fieldset disabled={m.isPending || savedItemId !== null} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="new-name">Nom</Label><Input id="new-name" className="h-11" required placeholder="Lave-linge" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Catégorie</Label>
            <CategoryPicker category={category} onCategory={setCategory} name={f.name} onType={(t) => setF((prev) => ({ ...prev, name: t }))} />
          </div>
          <div className="space-y-1.5"><Label htmlFor="new-date">Date d'achat</Label><Input id="new-date" className="h-11" type="date" required value={f.purchase_date} onChange={(e) => setF({ ...f, purchase_date: e.target.value })} /></div>
          <p className="text-xs text-muted-foreground">Garantie légale proposée : {f.warranty_months > 0 ? `${f.warranty_months / 12} an${f.warranty_months > 12 ? "s" : ""}` : "aucune"}. Ajustez-la dans les informations complémentaires.</p>
          </fieldset>
          <Rubrique compact title="Ajouter des informations complémentaires" hint="marque, magasin, prix, facture, garanties, alertes, photos" open={detailsOpen} onOpenChange={setDetailsOpen} contentClassName="mt-4 space-y-4">
              <fieldset disabled={m.isPending || savedItemId !== null} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Marque</Label><Input className="h-11" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Magasin</Label><Input className="h-11" value={f.store} onChange={(e) => setF({ ...f, store: e.target.value })} /></div>
                </div>
                <div className="space-y-1.5"><Label>Prix (€, facultatif)</Label><Input className="h-11" type="number" min="0" step="0.01" inputMode="decimal" placeholder="ex. 49,90" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="new-order">N° de facture ou de commande</Label><Input id="new-order" className="h-11" placeholder="Rempli par le ticket, ou à saisir" value={f.order_number} onChange={(e) => setF({ ...f, order_number: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="new-order-date">Date de la facture ou de la commande</Label><Input id="new-order-date" className="h-11" type="date" value={f.order_date} onChange={(e) => setF({ ...f, order_date: e.target.value })} /></div>
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-medium">Garantie légale</p>
                  <div className="grid grid-cols-3 gap-2">
                    <LegalSelect label="Pays d’achat" value={legal.country} onChange={(v) => applyLegal({ ...legal, country: v as PurchaseCountry })} options={[["france", "France"], ["ue", "Autre pays UE"], ["hors_ue", "Hors UE"]]} />
                    <LegalSelect label="Vendeur" value={legal.seller} onChange={(v) => applyLegal({ ...legal, seller: v as SellerType })} options={[["pro", "Professionnel"], ["particulier", "Particulier"]]} />
                    <LegalSelect label="État" value={legal.condition} onChange={(v) => applyLegal({ ...legal, condition: v as ItemCondition })} options={[["neuf", "Neuf"], ["occasion", "Occasion"]]} />
                  </div>
                  <p className="text-xs text-muted-foreground">{estimate.certainty === "estimation" && <span className="font-medium">Estimation · </span>}{estimate.certainty === "inconnue" && <span className="font-medium">À vérifier · </span>}{estimate.note}</p>
                  <WarrantyYearSelect id="primary-years" label="Durée retenue" warrantyKey="base" value={f.warranty_months > 0 ? f.warranty_months / 12 : null} onChange={(y) => setF({ ...f, warranty_months: y === null ? 0 : y * 12 })} />
                </div>
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
          </Rubrique>
          <div className="sticky -bottom-6 -mx-6 border-t bg-background px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
            <Button className="h-11 w-full" disabled={m.isPending}>{m.isPending ? "Enregistrement…" : savedItemId ? "Réessayer l’envoi des photos" : "Enregistrer l’objet"}</Button>
          </div>
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
  const [query, setQuery] = useState("");
  const [quick, setQuick] = useState<QuickFilter>("tous");
  const [sortDeadline, setSortDeadline] = useState(false);
  const today0 = todayISO();
  const filtered = applyQuickFilter(allItems.filter((i) => (!cat || i.category === cat) && matchesSearch(i, query)), quick, today0);
  const items = sortDeadline ? sortByDeadline(filtered, today0) : filtered;
  const value = protectedValue(allItems, today0);
  const usedCats = [...CATEGORIES.filter((c) => allItems.some((i) => i.category === c)), ...Array.from(new Set(allItems.map((i) => i.category))).filter((c) => !CATEGORIES.includes(c))];
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

  const activeItems = items.filter((i) => !isArchived(i, today));
  const archivedItems = items.filter((i) => isArchived(i, today));
  const renderItem = (i: (typeof items)[number]) => {
            const catImg = categoryImage(i.category);
            return (
              <li key={i.id} className={`rounded-xl border-2 bg-card p-3 ${memberBorderClass(i.user_id)}`}>
                <div className="flex items-start gap-3">
                  {catImg ? <img src={catImg} alt="" loading="lazy" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg object-cover" /> : <span aria-hidden className="h-10 w-10 shrink-0 rounded-lg bg-muted" />}
                  <div className="min-w-0 flex-1">
                    <Link to="/objet/$id" params={{ id: i.id }} className="font-medium hover:text-accent">{i.name} {i.brand && <span className="text-muted-foreground font-normal">· {i.brand}</span>}</Link>
                    {i.return_status !== "none" && <p className="text-xs text-warning">Retour : {RETURN_LABELS[i.return_status] ?? i.return_status}</p>}
                    <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-accent">{i.category}
                      {i.price != null && <span className="ml-2 normal-case tracking-normal text-muted-foreground">· {formatPrice(i.price)}</span>}
                      {household && me && i.user_id !== me && <span className="ml-2 normal-case tracking-normal text-muted-foreground">· ajouté par {household.members.find((m) => m.user_id === i.user_id)?.display_name?.trim() || "un membre"}</span>}
                    </p>
                  </div>
                  {(() => { const c = itemCoverage(i, today); return c.status && <StatusBadge value={c.status} />; })()}
                  <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => del(i.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-2 space-y-1 rounded-md border border-border/60 bg-muted/40 px-2.5 py-2">
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
          };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-4xl sm:text-5xl">{household ? household.name : "Mes objets"}</h1>
          {household && <p className="mt-2 font-serif text-base italic text-foreground/75">Vos biens comptent. Gardez-en la preuve.</p>}
          {household && <p className="mt-1 text-sm text-muted-foreground">Partagé avec {household.members.length} personne(s)</p>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2"><Button asChild variant="outline" size="icon" aria-label="Calendrier des garanties" title="Calendrier des garanties"><Link to="/calendrier"><CalendarDays /></Link></Button>{allItems.length > 0 && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label="Plus d’options" title="Plus d’options"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => { const url = URL.createObjectURL(new Blob([buildInventoryCsv(allItems, today0)], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = `inventaire-garanties-${today0}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000); }}>Exporter l’inventaire (CSV)</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}<AddItem householdId={household?.id ?? null} blocked={!canAddItem(household?.plan ?? "gratuit", allItems.length)} /></div>
      </div>
      {allItems.length > 0 && <div className="mt-4 space-y-3"><InsuranceExport items={allItems} plan={household?.plan ?? "gratuit"} /><TitaneExports plan={household?.plan ?? "gratuit"} /></div>}
      {allItems.length > 0 && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden /> Valeur de vos biens enregistrés</p>
          {value.priced > 0 ? (
            <>
              <p className="mt-1 text-3xl tabular-nums">{formatPrice(value.total)}</p>
              <p className="text-xs text-muted-foreground">{value.priced} objet(s) sous garantie active{value.unpriced > 0 ? ` · ${value.unpriced} sans prix renseigné` : ""}</p>
              <p className="mt-2 text-xs text-muted-foreground">Retrouvez les justificatifs de vos biens pour faciliter vos démarches en cas de sinistre.</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">{value.active === 0 ? "Aucun objet n’a de garantie active pour le moment." : "Aucun prix renseigné sur vos objets sous garantie : ajoutez-le depuis la fiche de l’objet pour voir la valeur protégée."}</p>
          )}
        </div>
      )}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-banner px-3 py-2.5 text-banner-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">Un imprévu peut arriver. Vos preuves restent à portée de main.</p>
          <p className="mt-0.5 text-xs leading-relaxed opacity-80">Conservez vos factures et justificatifs pour faciliter vos démarches en cas de sinistre.</p>
        </div>
      </div>
      {allItems.length > 0 && (
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label="Rechercher un objet" placeholder="Rechercher : nom, marque, magasin, catégorie…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
        </div>
      )}
      {allItems.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {QUICK_FILTERS.map((q) => (
            <Button key={q.key} size="sm" variant={quick === q.key ? "default" : "outline"} className="rounded-full" aria-pressed={quick === q.key} onClick={() => setQuick(q.key)}>{q.label}</Button>
          ))}
          <Button size="sm" variant={sortDeadline ? "default" : "outline"} className="rounded-full" aria-pressed={sortDeadline} onClick={() => setSortDeadline((v) => !v)}>Trier par échéance</Button>
        </div>
      )}
      {usedCats.length > 0 && (cat === null ? (query.trim() || quick !== "tous" ? null : (
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
      )) : (
        <div className="mt-6 flex items-center gap-2">
          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setCat(null)}>← Toutes les catégories</Button>
          <span className="flex items-center gap-1.5 text-sm font-medium"><img src={categoryImage(cat) ?? ""} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full object-cover" />{cat} · {items.length}</span>
        </div>
      ))}

      {(upcoming.length > 0 || firstYearItems.length > 0) && (
        <div className="mt-8 rounded-lg border border-accent/40 bg-accent/10 p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><Bell className="h-4 w-4 text-accent" />Rappels de garantie</p>
          <ul className="mt-2 space-y-1 text-sm">
            {[...new Set([...firstYearItems.map((i) => i.id), ...upcoming.map((u) => u.item.id)])].map((id) => {
              const it = items.find((i) => i.id === id)!;
              const parts = [
                ...(firstYearItems.some((i) => i.id === id) ? ["Fin de la première année aujourd’hui"] : []),
                ...[...new Map(upcoming.filter((u) => u.item.id === id).map((u) => [u.label, u])).values()].map((u) => `${u.label} — fin le ${fmt(u.end)} (${daysLeft(u.end, today)} j)`),
              ];
              return <li key={id}><Link to="/objet/$id" params={{ id }} className="hover:underline"><span className="font-medium">{it.name}</span> · {parts.join(" ; ")}</Link></li>;
            })}
          </ul>
        </div>
      )}

      <RightBanner offset={0} className="mt-8" />
      {items.length === 0 ? (
        allItems.length > 0 ? (
          <div className="mt-12 text-center text-muted-foreground">
            <p>Aucun objet ne correspond{query.trim() ? <> à « {query.trim()} »</> : null}{cat ? <> dans {cat}</> : null}{quick !== "tous" ? <> avec le filtre « {QUICK_FILTERS.find((q) => q.key === quick)?.label} »</> : null}.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setQuery(""); setCat(null); setQuick("tous"); }}>Effacer les filtres</Button>
          </div>
        ) : <p className="mt-16 text-center text-muted-foreground">Aucun objet pour l'instant. Ajoutez votre premier achat.</p>
      ) : (
        <>
          <ul className="mt-5 space-y-2">{activeItems.map(renderItem)}</ul>
          {activeItems.length === 0 && <p className="mt-8 text-center text-sm text-muted-foreground">Tous ces objets sont classés.</p>}
          {archivedItems.length > 0 && (
            <div className="mt-10 text-center"><Button asChild variant="outline"><Link to="/affaires-classees">Affaires classées ({archivedItems.length})</Link></Button></div>
          )}
        </>
      )}
    </main>
  );
}
