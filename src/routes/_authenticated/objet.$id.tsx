import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Printer, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { itemsQuery, fmt, todayISO, RETURN_LABELS } from "@/lib/items";
import { warrantyEnd, itemWarranties, yearsLabel } from "@/lib/warranty";
import { WarrantyYearSelect } from "@/components/WarrantyYearSelect";
import { ItemPhotos } from "@/components/ItemPhotos";
import { buildLetter, type LetterInput } from "@/lib/letter";
import { Receipts } from "@/components/Receipts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/objet/$id")({
  head: () => ({ meta: [{ title: "Objet — Garantia" }, { name: "description", content: "Détail, réclamation et suivi de retour." }, { property: "og:title", content: "Objet — Garantia" }, { property: "og:description", content: "Factures, lettre de conformité et suivi des retours de votre objet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(itemsQuery),
  component: ItemPage,
});

function ItemPage() {
  const { id } = Route.useParams();
  const { data: items } = useSuspenseQuery(itemsQuery);
  const qc = useQueryClient();
  const item = items.find((i) => i.id === id);
  const [ret, setRet] = useState({
    return_status: item?.return_status ?? "none",
    return_sent_date: item?.return_sent_date ?? "",
    return_tracking: item?.return_tracking ?? "",
    return_notes: item?.return_notes ?? "",
  });
  const [l, setL] = useState({ senderName: "", senderAddress: "", problem: "panne" as LetterInput["problem"], details: "" });
  const [reportOpen, setReportOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [storeYears, setStoreYears] = useState<number | null>(item?.store_warranty_years ?? null);
  const [brandYears, setBrandYears] = useState<number | null>(item?.brand_warranty_years ?? null);
  const [savingWarranties, setSavingWarranties] = useState(false);
  const letterRef = useRef<HTMLElement>(null);
  function reportProblem(problem: LetterInput["problem"]) {
    setL((value) => ({ ...value, problem }));
    setLetterOpen(true);
    setTimeout(() => letterRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }), 50);
  }

  if (!item) return <main className="p-12 text-center">Objet introuvable.</main>;
  const end = warrantyEnd(item.purchase_date, item.warranty_months);
  const letter = buildLetter({ ...l, store: item.store ?? "", itemName: item.name, brand: item.brand, purchaseDate: fmt(item.purchase_date), warrantyEnd: fmt(end), today: fmt(todayISO()) });

  async function saveReturn() {
    const { error } = await supabase.from("items").update({ ...ret, return_sent_date: ret.return_sent_date || null }).eq("id", id);
    if (error) { toast.error("Enregistrement impossible"); return; }
    qc.invalidateQueries({ queryKey: ["items"] });
    toast.success("Suivi enregistré");
  }
  async function saveWarranties() {
    setSavingWarranties(true);
    try {
      const { error } = await supabase.from("items").update({ store_warranty_years: storeYears, brand_warranty_years: brandYears }).eq("id", id);
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
      <p className="mt-2 text-muted-foreground">Acheté le {fmt(item.purchase_date)}{item.store ? ` chez ${item.store}` : ""} · garantie jusqu'au {fmt(end)}</p>

      <section className="mt-6 border-y py-6">
        <h2 className="text-2xl">Garanties magasin et marque</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <WarrantyYearSelect id="store-years" label="Garantie magasin" value={storeYears} onChange={setStoreYears} />
          <WarrantyYearSelect id="brand-years" label="Garantie de marque" value={brandYears} onChange={setBrandYears} />
        </div>
        {itemWarranties(item).filter((w) => w.key !== "base").map((w) => <p key={w.key} className="mt-3 text-sm text-muted-foreground">{w.label} · {yearsLabel((w.key === "store" ? item.store_warranty_years : item.brand_warranty_years) ?? 1)} · jusqu’au {fmt(w.end)}</p>)}
        <Button className="mt-4" disabled={savingWarranties} onClick={saveWarranties}>{savingWarranties ? "Enregistrement…" : "Enregistrer les garanties"}</Button>
      </section>

      <Button className="mt-6" variant="outline" aria-expanded={reportOpen} onClick={() => setReportOpen(!reportOpen)}><TriangleAlert />Signaler un problème</Button>
      {reportOpen && <section className="mt-4 border-y py-5">
        <h2 className="text-2xl">Que se passe-t-il avec cet objet ?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => reportProblem("panne")}>Dysfonctionnement</Button>
          <Button variant="outline" onClick={() => reportProblem("casse")}>Objet détérioré ou cassé</Button>
          <Button variant="outline" onClick={() => reportProblem("hs")}>Ne fonctionne plus</Button>
        </div>
      </section>}

      <Receipts itemId={item.id} />
      <ItemPhotos itemId={item.id} />

      <section className="mt-8 rounded-lg border bg-card p-6">
        <h2 className="text-2xl">Suivi du retour</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Statut</Label>
            <Select value={ret.return_status} onValueChange={(v) => setRet({ ...ret, return_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(RETURN_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Date d'envoi</Label><Input type="date" value={ret.return_sent_date} onChange={(e) => setRet({ ...ret, return_sent_date: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>N° de suivi / dossier</Label><Input value={ret.return_tracking} onChange={(e) => setRet({ ...ret, return_tracking: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea value={ret.return_notes} onChange={(e) => setRet({ ...ret, return_notes: e.target.value })} /></div>
        </div>
        <Button className="mt-4" onClick={saveReturn}>Enregistrer</Button>
      </section>

      <section ref={letterRef} className="mt-8 scroll-mt-6 border-t py-6">
        <h2 className="text-2xl">Lettre de demande de remplacement</h2>
        {!letterOpen && <Button className="mt-4" variant="outline" onClick={() => setLetterOpen(true)}>Rédiger une lettre</Button>}
        {letterOpen && <>
        <p className="mt-3 text-sm text-muted-foreground">La garantie légale de conformité concerne les défauts couverts par la loi lors d’un achat auprès d’un vendeur professionnel. Une casse accidentelle ou une mauvaise utilisation n’est pas automatiquement couverte ; la durée de garantie enregistrée ne suffit pas à établir vos droits.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Votre nom</Label><Input value={l.senderName} onChange={(e) => setL({ ...l, senderName: e.target.value })} /></div>
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
          <div className="space-y-1.5 sm:col-span-2"><Label>Votre adresse</Label><Input value={l.senderAddress} onChange={(e) => setL({ ...l, senderAddress: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description du problème (facultatif)</Label><Textarea value={l.details} onChange={(e) => setL({ ...l, details: e.target.value })} /></div>
        </div>
        <pre className="mt-6 whitespace-pre-wrap rounded-md border bg-background p-5 font-serif text-[15px] leading-relaxed">{letter}</pre>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(letter); toast.success("Lettre copiée"); }}><Copy className="h-4 w-4" />Copier</Button>
          <Button onClick={print}><Printer className="h-4 w-4" />Imprimer / PDF</Button>
        </div>
        </>}
      </section>
    </main>
  );
}
