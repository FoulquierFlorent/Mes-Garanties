import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Printer, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, fmt, todayISO, RETURN_LABELS } from "@/lib/items";
import { warrantyEnd, itemWarranties, yearsLabel } from "@/lib/warranty";
import { WarrantyYearSelect } from "@/components/WarrantyYearSelect";
import { WarrantyMarker } from "@/components/WarrantyMarker";
import { ItemPhotos } from "@/components/ItemPhotos";
import { buildLetter, type LetterInput, type WarrantyLetterType } from "@/lib/letter";
import { canShowReturnTracking, savedReplacementLetter } from "@/lib/return-flow";
import { Receipts } from "@/components/Receipts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [l, setL] = useState({ senderName: savedLetter?.senderName ?? "", senderAddress: savedLetter?.senderAddress ?? "", problem: (savedLetter?.problem ?? "panne") as LetterInput["problem"], details: savedLetter?.details ?? "" });
  const [reportOpen, setReportOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(Boolean(savedLetter));
  const [letterWarranty, setLetterWarranty] = useState<WarrantyLetterType>(savedLetter?.warrantyType ?? "base");
  const [savingLetter, setSavingLetter] = useState(false);
  const [confirmingReturn, setConfirmingReturn] = useState(false);
  const [sentDate, setSentDate] = useState(todayISO());
  const [storeYears, setStoreYears] = useState<number | null>(item?.store_warranty_years ?? null);
  const [brandYears, setBrandYears] = useState<number | null>(item?.brand_warranty_years ?? null);
  const [baseYears, setBaseYears] = useState<number | null>(
    item && item.warranty_months % 12 === 0 ? item.warranty_months / 12 : null,
  );
  const [savingWarranties, setSavingWarranties] = useState(false);
  const letterRef = useRef<HTMLElement>(null);
  function reportProblem(problem: LetterInput["problem"]) {
    setL((value) => ({ ...value, problem }));
    setLetterOpen(true);
    setTimeout(() => letterRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }), 50);
  }

  if (!item) return <main className="p-12 text-center">Objet introuvable.</main>;
  const end = warrantyEnd(item.purchase_date, item.warranty_months);
  const baseYearsWhole = item.warranty_months % 12 === 0;
  const originalMonths = item.warranty_months;
  const warrantyRows = itemWarranties(item).map((w) => ({
    ...w,
    duration:
      w.key === "base"
        ? baseYearsWhole
          ? yearsLabel(item.warranty_months / 12)
          : `${item.warranty_months} mois`
        : yearsLabel((w.key === "store" ? item.store_warranty_years : item.brand_warranty_years) ?? 1),
  }));
  const chosenWarranty = warrantyRows.find((w) => w.key === letterWarranty);
  const letter = buildLetter({ ...l, warrantyType: letterWarranty, store: item.store ?? "", itemName: item.name, brand: item.brand, purchaseDate: fmt(item.purchase_date), warrantyEnd: chosenWarranty ? fmt(chosenWarranty.end) : "[Garantie non renseignée]", today: fmt(todayISO()) });
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
  async function saveWarranties() {
    setSavingWarranties(true);
    try {
      const patch: { store_warranty_years: number | null; brand_warranty_years: number | null; warranty_months?: number } = {
        store_warranty_years: storeYears,
        brand_warranty_years: brandYears,
      };
      if (baseYearsWhole && baseYears !== null && baseYears * 12 !== originalMonths) patch.warranty_months = baseYears * 12;
      const { error } = await supabase.from("items").update(patch).eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Garanties enregistrées");
    } catch { toast.error("Impossible d’enregistrer les garanties"); }
    finally { setSavingWarranties(false); }
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
      <p className="mt-2 text-muted-foreground">Acheté le {fmt(item.purchase_date)}{item.store ? ` chez ${item.store}` : ""} · garantie légale jusqu'au {fmt(end)}</p>

      <section className="mt-6 border-y py-6">
        <h2 className="text-2xl">Garanties</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {baseYearsWhole && <WarrantyYearSelect id="base-years" label="Garantie légale" value={baseYears} onChange={setBaseYears} optional={false} warrantyKey="base" />}
          <WarrantyYearSelect id="store-years" label="Garantie magasin" value={storeYears} onChange={setStoreYears} warrantyKey="store" />
          <WarrantyYearSelect id="brand-years" label="Garantie de marque" value={brandYears} onChange={setBrandYears} warrantyKey="brand" />
        </div>
        <div className="mt-4 space-y-1.5">
          {warrantyRows.map((w) => <p key={w.key} className="text-sm text-muted-foreground pl-8 -indent-8"><WarrantyMarker warrantyKey={w.key} className="mr-2" />{w.label} · {w.duration} · jusqu’au {fmt(w.end)}</p>)}
        </div>
        <Button className="mt-4" disabled={savingWarranties} onClick={saveWarranties}>{savingWarranties ? "Enregistrement…" : "Enregistrer les garanties"}</Button>
      </section>

      <Button className="mt-6" variant="outline" aria-expanded={reportOpen} onClick={() => setReportOpen(!reportOpen)}><TriangleAlert />Signaler un problème</Button>
      {reportOpen && <section className="mt-4 border-y py-5">
        <h2 className="text-2xl">Que se passe-t-il avec cet objet ?</h2>
        <RightBanner variant="whisper" offset={8} className="mt-2" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => reportProblem("panne")}>Dysfonctionnement</Button>
          <Button variant="outline" onClick={() => reportProblem("casse")}>Objet détérioré ou cassé</Button>
          <Button variant="outline" onClick={() => reportProblem("hs")}>Ne fonctionne plus</Button>
        </div>
      </section>}

      <Receipts itemId={item.id} />
      <ItemPhotos itemId={item.id} />

      <section ref={letterRef} className="mt-8 scroll-mt-6 border-t py-6">
        <h2 className="text-2xl">Lettre de demande de remplacement</h2>
        <RightBanner offset={9} className="mt-4" />
        {!letterOpen && <Button className="mt-4" variant="outline" onClick={() => setLetterOpen(true)}>Rédiger une lettre</Button>}
        {letterOpen && <>
        <div className="mt-4 space-y-1.5"><Label htmlFor="letter-warranty">Garantie utilisée</Label>
          <Select value={letterWarranty} onValueChange={(value) => { if (value === "base" || value === "store" || value === "brand") setLetterWarranty(value); }}>
            <SelectTrigger id="letter-warranty"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="base"><WarrantyMarker warrantyKey="base" />Garantie légale</SelectItem>
              <SelectItem value="store"><WarrantyMarker warrantyKey="store" />Garantie magasin</SelectItem>
              <SelectItem value="brand"><WarrantyMarker warrantyKey="brand" />Garantie de marque</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {!chosenWarranty && <p className="mt-3 text-sm text-destructive">Cette garantie n’est pas renseignée pour cet objet. Ajoutez sa durée dans la section Garanties.</p>}
        <p className="mt-3 text-sm text-muted-foreground">La garantie légale de conformité concerne les défauts couverts par la loi lors d’un achat auprès d’un vendeur professionnel. Une casse accidentelle ou une mauvaise utilisation n’est pas automatiquement couverte ; la durée de garantie enregistrée ne suffit pas à établir vos droits.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="letter-name">Votre nom</Label><Input id="letter-name" value={l.senderName} onChange={(e) => setL({ ...l, senderName: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Problème</Label>
            <Select value={l.problem} onValueChange={(v) => setL({ ...l, problem: v as LetterInput["problem"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="panne">Dysfonctionnement</SelectItem>
                <SelectItem value="casse">Objet cassé</SelectItem>
                <SelectItem value="hs">Ne marche plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="letter-address">Votre adresse</Label><Input id="letter-address" value={l.senderAddress} onChange={(e) => setL({ ...l, senderAddress: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description du problème (facultatif)</Label><Textarea value={l.details} onChange={(e) => setL({ ...l, details: e.target.value })} /></div>
        </div>
        <pre className="mt-6 whitespace-pre-wrap rounded-md border bg-background p-5 font-serif text-[15px] leading-relaxed">{letter}</pre>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={savingLetter || !chosenWarranty} onClick={saveLetter}>{savingLetter ? "Enregistrement…" : "Enregistrer la lettre"}</Button>
          <Button disabled={!chosenWarranty} variant="outline" onClick={() => { navigator.clipboard.writeText(letter); toast.success("Lettre copiée"); }}><Copy className="h-4 w-4" />Copier</Button>
          <Button disabled={!chosenWarranty} onClick={print}><Printer className="h-4 w-4" />Imprimer / PDF</Button>
        </div>
        </>}
      </section>
      {savedLetter && !showReturn && <section className="border-t py-6">
        <div className="space-y-1.5"><Label htmlFor="confirm-sent-date">Date du renvoi effectué</Label><Input id="confirm-sent-date" type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} /></div>
        <Button className="mt-4" disabled={confirmingReturn || !sentDate} onClick={confirmReturn}>{confirmingReturn ? "Confirmation…" : "Confirmer le renvoi effectué"}</Button>
      </section>}
      {showReturn && <section className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-2xl">Suivi du retour</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Statut</Label>
            <Select value={ret.return_status} onValueChange={(v) => setRet({ ...ret, return_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(RETURN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="return-date">Date d'envoi</Label><Input id="return-date" type="date" value={ret.return_sent_date} onChange={(e) => setRet({ ...ret, return_sent_date: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="return-tracking">N° de suivi / dossier</Label><Input id="return-tracking" value={ret.return_tracking} onChange={(e) => setRet({ ...ret, return_tracking: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="return-notes">Notes</Label><Textarea id="return-notes" value={ret.return_notes} onChange={(e) => setRet({ ...ret, return_notes: e.target.value })} /></div>
        </div>
        <Button className="mt-4" onClick={saveReturn}>Enregistrer</Button>
      </section>}
    </main>
  );
}
