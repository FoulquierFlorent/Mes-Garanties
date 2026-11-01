import { ReceiptSummary } from "@/components/ReceiptSummary";
import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Printer, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, fmt, todayISO, RETURN_LABELS, formatPrice } from "@/lib/items";
import { warrantyEnd, itemWarranties, yearsLabel, WARRANTY_LABELS } from "@/lib/warranty";
import { WarrantyYearSelect } from "@/components/WarrantyYearSelect";
import { WarrantyMarker } from "@/components/WarrantyMarker";
import { ItemPhotos, PhotoPicker } from "@/components/ItemPhotos";
import { uploadItemPhotos } from "@/lib/item-photos";
import { buildLetter, type LetterInput, type WarrantyLetterType } from "@/lib/letter";
import { canShowReturnTracking, savedReplacementLetter } from "@/lib/return-flow";
import { Receipts } from "@/components/Receipts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/objet/$id")({
  head: () => ({ meta: [{ title: "Objet — Mes garanties" }, { name: "description", content: "Détail, réclamation et suivi de retour." }, { property: "og:title", content: "Objet — Mes garanties" }, { property: "og:description", content: "Factures, lettre de conformité et suivi des retours de votre objet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery),
  component: ItemPage,
});

function ItemPage() {
  const { id } = Route.useParams();
  const { data: items } = useSuspenseQuery(itemsQuery);
  const qc = useQueryClient();
  const item = items.find((i) => i.id === id);
  const savedLetter = savedReplacementLetter(item?.replacement_letter);
  const [ret, setRet] = useState({
    return_status: item?.return_status ?? "none",
    return_sent_date: item?.return_sent_date ?? "",
    return_tracking: item?.return_tracking ?? "",
    return_notes: item?.return_notes ?? "",
  });
  // Resynchronise le suivi avec la fiche enregistrée (rechargement, autre membre du foyer).
  useEffect(() => {
    if (!item) return;
    setRet({
      return_status: item.return_status ?? "none",
      return_sent_date: item.return_sent_date ?? "",
      return_tracking: item.return_tracking ?? "",
      return_notes: item.return_notes ?? "",
    });
  }, [item?.id, item?.return_status, item?.return_sent_date, item?.return_tracking, item?.return_notes]);
  const [l, setL] = useState({ senderName: savedLetter?.senderName ?? "", senderAddress: savedLetter?.senderAddress ?? "", problem: (savedLetter?.problem ?? "panne") as LetterInput["problem"], details: savedLetter?.details ?? "" });
  const [letterOpen, setLetterOpen] = useState(Boolean(savedLetter));
  const [letterWarranty, setLetterWarranty] = useState<WarrantyLetterType>(savedLetter?.warrantyType ?? "base");
  const [savingLetter, setSavingLetter] = useState(false);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const [sentDate, setSentDate] = useState(todayISO());
  const [storeYears, setStoreYears] = useState<number | null>(item?.store_warranty_years ?? null);
  const [brandYears, setBrandYears] = useState<number | null>(item?.brand_warranty_years ?? null);
  const [constructorYears, setConstructorYears] = useState<number | null>(item?.constructor_warranty_years ?? null);
  const [extensionYears, setExtensionYears] = useState<number | null>(item?.extension_warranty_years ?? null);
  const [repairYears, setRepairYears] = useState<number | null>(item?.repair_warranty_years ?? null);
  const [baseYears, setBaseYears] = useState<number | null>(
    item && item.warranty_months % 12 === 0 ? item.warranty_months / 12 : null,
  );
  const [savingWarranties, setSavingWarranties] = useState(false);
  const [price, setPrice] = useState(item?.price != null ? String(item.price) : "");
  const [savingPrice, setSavingPrice] = useState(false);
  // Resynchronise le prix avec la fiche enregistrée (rechargement, autre membre du foyer).
  useEffect(() => {
    setPrice(item?.price != null ? String(item.price) : "");
  }, [item?.id, item?.price]);
  const [description, setDescription] = useState(item?.description ?? "");
  const [savingDescription, setSavingDescription] = useState(false);
  // Resynchronise le descriptif avec la fiche enregistrée.
  useEffect(() => {
    setDescription(item?.description ?? "");
  }, [item?.id, item?.description]);
  const [damagePhotos, setDamagePhotos] = useState<File[]>([]);
  const [uploadingDamage, setUploadingDamage] = useState(false);
  const { data: photoNames = [] } = useQuery({
    queryKey: ["item-photo-names", id],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("item-photos").list(id);
      if (error) return [];
      return (data ?? []).filter((f) => f.id).map((f) => f.name);
    },
  });
  const letterRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const [openSections, setOpenSections] = useState<string[]>(() => (savedLetter ? ["steps"] : []));
  function openSection(key: string) {
    setOpenSections((value) => (value.includes(key) ? value : [...value, key]));
  }
  function scrollToSection(ref: { current: Element | null }) {
    setTimeout(() => {
      const el = ref.current;
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      }
    }, 300);
  }
  function reportProblem(problem: LetterInput["problem"]) {
    setL((value) => ({ ...value, problem }));
    setLetterOpen(true);
    openSection("steps");
    scrollToSection(letterRef);
  }

  if (!item) return <main className="p-12 text-center">Objet introuvable.</main>;
  const end = warrantyEnd(item.purchase_date, item.warranty_months);
  const baseYearsWhole = item.warranty_months % 12 === 0;
  const originalMonths = item.warranty_months;
  const yearsByWarranty: Record<string, number | null | undefined> = {
    store: item.store_warranty_years,
    brand: item.brand_warranty_years,
    constructor: item.constructor_warranty_years,
    extension: item.extension_warranty_years,
    repair: item.repair_warranty_years,
  };
  const warrantyRows = itemWarranties(item).map((w) => ({
    ...w,
    duration:
      w.key === "base"
        ? baseYearsWhole
          ? yearsLabel(item.warranty_months / 12)
          : `${item.warranty_months} mois`
        : yearsLabel(yearsByWarranty[w.key] ?? 1),
  }));
  const chosenWarranty = warrantyRows.find((w) => w.key === letterWarranty);
  const letter = buildLetter({ ...l, warrantyType: letterWarranty, store: item.store ?? "", itemName: item.name, brand: item.brand, purchaseDate: fmt(item.purchase_date), warrantyEnd: chosenWarranty ? fmt(chosenWarranty.end) : "[Garantie non renseignée]", today: fmt(todayISO()), photoCount: photoNames.length });
  const showReturn = canShowReturnTracking(item.replacement_letter, item.return_sent_date);

  async function saveLetter() {
    if (!chosenWarranty) { toast.error("Renseignez cette garantie dans la section Garanties avant de rédiger la lettre"); return; }
    if (!l.senderName.trim() || !l.senderAddress.trim()) {
      toast.error("Renseignez votre nom et votre adresse avant d’enregistrer la lettre");
      return;
    }
    setSavingLetter(true);
    try {
      const { error } = await supabase.from("items").update({ replacement_letter: { ...l, warrantyType: letterWarranty, text: letter } }).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Lettre enregistrée");
    } catch { toast.error("Impossible d’enregistrer la lettre"); }
    finally { setSavingLetter(false); }
  }

  async function confirmReturn() {
    if (!savedLetter || !sentDate) return;
    setConfirmingReturn(true);
    try {
      const { error } = await supabase.from("items").update({ return_status: "sent", return_sent_date: sentDate }).eq("id", id);
      if (error) throw error;
      setRet((value) => ({ ...value, return_status: "sent", return_sent_date: sentDate }));
      await qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Renvoi confirmé");
    } catch { toast.error("Impossible de confirmer le renvoi"); }
    finally { setConfirmingReturn(false); }
  }

  async function saveReturn() {
    const { error } = await supabase.from("items").update({ ...ret, return_sent_date: ret.return_sent_date || null }).eq("id", id);
    if (error) { toast.error("Enregistrement impossible"); return; }
    qc.invalidateQueries({ queryKey: ["items"] });
    toast.success("Suivi enregistré");
  }
  async function saveDescription() {
    setSavingDescription(true);
    try {
      const { error } = await supabase.from("items").update({ description: description.trim() || null }).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Descriptif enregistré");
    } catch { toast.error("Impossible d’enregistrer le descriptif"); }
    finally { setSavingDescription(false); }
  }
  async function savePrice() {
    const trimmed = price.trim().replace(",", ".");
    const value = trimmed === "" ? null : Number(trimmed);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      toast.error("Le prix doit être un nombre positif");
      return;
    }
    setSavingPrice(true);
    try {
      const { error } = await supabase.from("items").update({ price: value }).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["items"] });
      toast.success(value === null ? "Prix retiré" : "Prix enregistré");
    } catch { toast.error("Impossible d’enregistrer le prix"); }
    finally { setSavingPrice(false); }
  }
  async function saveWarranties() {
    setSavingWarranties(true);
    try {
      const patch: { store_warranty_years: number | null; brand_warranty_years: number | null; constructor_warranty_years: number | null; extension_warranty_years: number | null; repair_warranty_years: number | null; warranty_months?: number } = {
        store_warranty_years: storeYears,
        brand_warranty_years: brandYears,
        constructor_warranty_years: constructorYears,
        extension_warranty_years: extensionYears,
        repair_warranty_years: repairYears,
      };
      if (baseYearsWhole && baseYears !== null && baseYears * 12 !== originalMonths) patch.warranty_months = baseYears * 12;
      const { error } = await supabase.from("items").update(patch).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Garanties enregistrées");
    } catch { toast.error("Impossible d’enregistrer les garanties"); }
    finally { setSavingWarranties(false); }
  }
  async function attachDamagePhotos() {
    if (!damagePhotos.length) return;
    setUploadingDamage(true);
    try {
      const failed = await uploadItemPhotos(id, damagePhotos);
      setDamagePhotos(failed);
      await qc.invalidateQueries({ queryKey: ["item-photos", id] });
      await qc.invalidateQueries({ queryKey: ["item-photo-names", id] });
      if (failed.length) toast.error("Certaines photos n'ont pas pu être jointes. Réessayez.");
      else toast.success("Photo jointe au dossier de l'objet");
    } catch { toast.error("Envoi de la photo impossible"); }
    finally { setUploadingDamage(false); }
  }

  function print() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<pre style="font-family:Georgia,serif;font-size:14px;white-space:pre-wrap;max-width:640px;margin:40px auto">${letter.replace(/</g, "&lt;")}</pre>`);
    w.document.close();
    w.print();
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Retour</Link>
      <p className="mt-6 text-xs uppercase tracking-wider text-accent">{item.category}</p>
      <h1 className="text-4xl sm:text-5xl">{item.name}</h1>
      <p className="mt-2 text-muted-foreground">Acheté le {fmt(item.purchase_date)}{item.store ? ` chez ${item.store}` : ""}{item.price != null ? ` · ${formatPrice(item.price)}` : ""} · garantie légale jusqu'au {fmt(end)}</p>

      <ItemPhotos itemId={item.id} />

      <section className="mt-6 border-y py-6">
        <h2 className="text-2xl">Descriptif et prix</h2>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="item-description">Descriptif (facultatif)</Label>
          <Textarea id="item-description" rows={3} placeholder="Ex. modèle, couleur, numéro de série, état…" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="item-price">Prix d’achat (€, facultatif)</Label>
            <Input id="item-price" type="number" min="0" step="0.01" inputMode="decimal" placeholder="ex. 49,90" className="w-40" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <Button variant="outline" disabled={savingDescription} onClick={saveDescription}>{savingDescription ? "Enregistrement…" : "Enregistrer le descriptif"}</Button>
          <Button variant="outline" disabled={savingPrice} onClick={savePrice}>{savingPrice ? "Enregistrement…" : "Enregistrer le prix"}</Button>
        </div>
      </section>

      <section className="mt-6 border-b pb-6">
        <h2 className="text-2xl">Garanties</h2>
        <WarrantyMarker className="mt-4" />
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-warranty-legal" />Légale : {baseYears === 0 ? "non applicable" : `${baseYears} an${baseYears > 1 ? "s" : ""}`}</span>
          <span className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-warranty-store" />Magasin : {storeYears === 0 ? "aucune" : `${storeYears} an${storeYears > 1 ? "s" : ""}`}</span>
          <span className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-warranty-brand" />Marque : {brandYears === 0 ? "aucune" : `${brandYears} an${brandYears > 1 ? "s" : ""}`}</span>
          <span className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-warranty-constructor" />Constructeur : {constructorYears === 0 ? "aucune" : `${constructorYears} an${constructorYears > 1 ? "s" : ""}`}</span>
          <span className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-warranty-extension" />Extension : {extensionYears === 0 ? "aucune" : `${extensionYears} an${extensionYears > 1 ? "s" : ""}`}</span>
          <span className="flex items-center gap-2"><span className="h-3 w-8 rounded-sm bg-warranty-repair" />Réparation : {repairYears === 0 ? "aucune" : `${repairYears} an${repairYears > 1 ? "s" : ""}`}</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">Fins : {warrantySummary(item)}</p>
        <Button className="mt-4" variant="outline" disabled={m.isPending || item.return_status === "waiting"} onClick={saveWarranties}><Save />Enregistrer les garanties</Button>
      </section>

      <Button className="mt-6 w-full sm:w-auto" variant="outline" onClick={() => { openSection("steps"); scrollToSection(stepsRef); }}><TriangleAlert />Signaler un problème</Button>

      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="mt-8">
        <AccordionItem value="docs">
          <AccordionTrigger className="font-serif text-2xl font-normal hover:no-underline">Factures, tickets et résumé</AccordionTrigger>
          <AccordionContent className="[&>section:first-child]:mt-0 [&>section:first-child]:border-t-0">
            <Receipts itemId={item.id} />
            <ReceiptSummary itemId={item.id} summary={item.receipt_summary ?? null} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="steps" ref={stepsRef}>
          <AccordionTrigger className="font-serif text-2xl font-normal hover:no-underline">
            <span>Démarches en cas de problème{savedLetter && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-sans text-xs font-normal text-muted-foreground">Lettre enregistrée</span>}{showReturn && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 font-sans text-xs font-normal text-muted-foreground">Retour {RETURN_LABELS[item.return_status]}</span>}</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-6 pt-2">
            <section>
              <h3 className="text-xl">Que se passe-t-il avec cet objet ?</h3>
              <RightBanner variant="whisper" offset={8} className="mt-2" />
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant={l.problem === "dysfunction" ? "default" : "outline"} onClick={() => reportProblem("dysfunction")}>Dysfonctionnement</Button>
                <Button variant={l.problem === "broken" ? "default" : "outline"} onClick={() => reportProblem("broken")}>Cassé</Button>
                <Button variant={l.problem === "dead" ? "default" : "outline"} onClick={() => reportProblem("dead")}>Ne marche plus</Button>
              </div>
              <div className="mt-5">
                <h4 className="text-sm font-medium">Photo de l’objet endommagé</h4>
                <p className="mb-3 text-xs text-muted-foreground">Facultatif : elle est rangée avec les photos de l’objet et mentionnée dans la lettre.</p>
                <PhotoPicker files={damagePhotos} onChange={setDamagePhotos} disabled={m.isPending} />
                {damagePhotos.length > 0 && <Button className="mt-3" variant="outline" disabled={m.isPending} onClick={attachDamagePhotos}><Paperclip />Joindre au dossier</Button>}
              </div>
            </section>

            <section ref={letterRef} className="border-t pt-6">
              {!letterOpen ? <Button variant="outline" onClick={() => setLetterOpen(true)}>Rédiger une lettre</Button> : <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl">Lettre de demande de remplacement</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyLetter}><Copy />Copier</Button>
                  <Button size="sm" variant="outline" onClick={printLetter}><Printer />Imprimer</Button>
                  <Button size="sm" variant="outline" disabled={m.isPending} onClick={saveLetter}><Save />Enregistrer</Button>
                </div>
              </div>
              <RightBanner className="mt-4" text="La garantie légale de conformité est un droit, pas une faveur." />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {warrantyOptions.map((option) => (
                  <label key={option.key} className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm">
                    <input type="radio" name="letter-warranty" checked={letterWarranty === option.key} onChange={() => setLetterWarranty(option.key)} />
                    <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: `var(--warranty-${option.key})` }} />
                    {option.label}
                    <span className="ml-auto text-xs text-muted-foreground">jusqu’au {fmt(option.deadline)}</span>
                  </label>
                ))}
              </div>
              {!chosenWarranty && <p className="mt-3 text-sm text-destructive">Choisissez la garantie à activer pour rédiger la lettre.</p>}
              {chosenWarranty?.commercial && <p className="mt-3 text-sm text-muted-foreground">Les règles de la garantie légale de conformité ne s’appliquent pas ici : cette lettre s’appuie sur le contrat de {chosenWarranty.label.toLowerCase()} de {item.store || "le vendeur"}.</p>}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="letter-from">De</Label><Input id="letter-from" value={l.from} onChange={(e) => setL({ ...l, from: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-address">Adresse</Label><Input id="letter-address" value={l.address} onChange={(e) => setL({ ...l, address: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-to">À</Label><Input id="letter-to" value={l.to} onChange={(e) => setL({ ...l, to: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-store">Magasin</Label><Input id="letter-store" value={l.store} onChange={(e) => setL({ ...l, store: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-purchase">Acheté le</Label><Input id="letter-purchase" type="date" value={l.purchaseDate} onChange={(e) => setL({ ...l, purchaseDate: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-obj">Objet</Label><Input id="letter-obj" value={l.object} onChange={(e) => setL({ ...l, object: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-problem">Problème</Label><Select value={l.problem ?? "dysfunction"} onValueChange={(v) => setL({ ...l, problem: v as LetterInput["problem"] })}><SelectTrigger id="letter-problem"><SelectValue /></SelectTrigger><SelectContent>{PROBLEMS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label htmlFor="letter-deadline">Deadline</Label><Input id="letter-deadline" type="date" value={l.deadline} onChange={(e) => setL({ ...l, deadline: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-ref">Référence</Label><Input id="letter-ref" value={l.reference} onChange={(e) => setL({ ...l, reference: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-invoice">Facture</Label><Input id="letter-invoice" value={l.invoice} onChange={(e) => setL({ ...l, invoice: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-serial">N° de série</Label><Input id="letter-serial" value={l.serial} onChange={(e) => setL({ ...l, serial: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="letter-date">Date</Label><Input id="letter-date" type="date" value={l.date} onChange={(e) => setL({ ...l, date: e.target.value })} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="letter-claims">Demandes</Label><Textarea id="letter-claims" value={l.claims} onChange={(e) => setL({ ...l, claims: e.target.value })} /></div>
              </div>
              </>}
            </section>
            {savedLetter && !showReturn && <section className="border-t pt-6">
              <h3 className="text-xl">Renvoi effectué</h3>
              <p className="mt-2 text-sm text-muted-foreground">Confirmez le renvoi pour ouvrir le suivi du retour.</p>
              <Button className="mt-3" disabled={m.isPending} onClick={confirmReturn}><Send />J’ai renvoyé l’objet</Button>
            </section>}
            {showReturn && <section className="border-t pt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl">Suivi du retour</h3>
                <Badge variant="secondary">{RETURN_LABELS[item.return_status]}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Renvoyé le {fmt(item.return_sent_date ?? "")} · reçu le {fmt(item.return_received_date ?? "")}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="return-carrier">Transporteur</Label><Input id="return-carrier" value={ret.carrier} onChange={(e) => setRet({ ...ret, carrier: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="return-tracking">N° de suivi</Label><Input id="return-tracking" value={ret.trackingNumber} onChange={(e) => setRet({ ...ret, trackingNumber: e.target.value })} /></div>
                <div className="space-y-1.5"><Label htmlFor="return-status">Étape</Label><Select value={ret.status} onValueChange={(v) => setRet({ ...ret, status: v as ItemReturnStatus })}><SelectTrigger id="return-status"><SelectValue /></SelectTrigger><SelectContent>{(["waiting", "in_transit", "received"] as const).map((s) => <SelectItem key={s} value={s}>{RETURN_LABELS[s]}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5"><Label htmlFor="return-date">Date</Label><Input id="return-date" type="date" value={ret.date} onChange={(e) => setRet({ ...ret, date: e.target.value })} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="return-notes">Notes</Label><Textarea id="return-notes" value={ret.notes} onChange={(e) => setRet({ ...ret, notes: e.target.value })} /></div>
              </div>
              <Button className="mt-4" onClick={saveReturn}>Enregistrer</Button>
            </section>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </main>
  );
}
