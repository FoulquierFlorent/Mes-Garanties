import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Item } from "@/lib/items";
import { fmt, todayISO } from "@/lib/items";
import { daysLeft, itemWarranties, warrantyDetail, warrantyEnd, yearsLabel, type WarrantyDetail, type WarrantyKey } from "@/lib/warranty";
import { uploadReceipt } from "@/lib/receipt-upload";
import { WarrantyMarker } from "@/components/WarrantyMarker";
import { StatusBadge } from "@/components/HouseholdUi";
import { status } from "@/lib/warranty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Rubrique } from "@/components/Rubrique";

/** Edit only the selected warranty; preserve all other details and private documents. */
export function ItemWarrantyDetails({ item }: { item: Item }) {
  return <div className="mt-4 grid gap-3 sm:grid-cols-2">{itemWarranties(item).map((w) => {
    const detail = warrantyDetail(item, w.key);
    const start = detail.start_date || item.purchase_date;
    const remaining = daysLeft(w.end, todayISO());
    const months = w.key === "base" ? item.warranty_months : (item[`${w.key}_warranty_years`] ?? 0) * 12;
    return <article key={w.key} className="min-w-0 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 font-sans text-sm font-semibold"><WarrantyMarker warrantyKey={w.key} /><span className="min-w-0 break-words">{w.label}</span></h3>
        <StatusBadge value={status(w.end, todayISO())} />
      </div>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-muted-foreground">Durée</dt><dd>{months % 12 === 0 ? yearsLabel(months / 12) : `${months} mois`}</dd></div>
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-muted-foreground">Début</dt><dd>{fmt(start)}</dd></div>
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-muted-foreground">Fin</dt><dd>{fmt(w.end)}</dd></div>
        <div className="flex flex-wrap justify-between gap-x-3"><dt className="text-muted-foreground">Temps restant</dt><dd>{remaining < 0 ? "Expirée" : `${remaining} jour${remaining > 1 ? "s" : ""}`}</dd></div>
        <div className="pt-2"><dt className="text-xs text-muted-foreground">{w.key === "repair" ? "Réparateur" : "Organisme responsable"}</dt><dd className="break-words">{detail.provider || (w.key === "base" || w.key === "store" ? item.store : w.key === "brand" || w.key === "constructor" ? item.brand : null) || "Non renseigné"}</dd></div>
      </dl>
      {detail.conditions && <p className="mt-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">{detail.conditions}</p>}
      {w.key !== "base" && <WarrantyDetailsEditor item={item} warrantyKey={w.key} />}
    </article>;
  })}</div>;
}

function WarrantyDetailsEditor({ item, warrantyKey }: { item: Item; warrantyKey: WarrantyKey }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<WarrantyDetail>(() => warrantyDetail(item, warrantyKey));
  const [contract, setContract] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => { setDraft(warrantyDetail(item, warrantyKey)); }, [item.warranty_details, warrantyKey]);
  const saved = warrantyDetail(item, warrantyKey);
  const years = warrantyKey === "base" ? item.warranty_months / 12 : item[`${warrantyKey}_warranty_years`];
  const previewEnd = years ? warrantyEnd(draft.start_date || item.purchase_date, years * 12) : null;
  function cancel() {
    setDraft(saved); setContract(null); setErrorMessage(""); setOpen(false);
  }
  async function openContract() {
    if (!saved.contract_file) return;
    const tab = window.open("", "_blank");
    const { data, error } = await supabase.storage.from("receipts").createSignedUrl(`${item.id}/${saved.contract_file}`, 300);
    if (error || !data) { tab?.close(); toast.error("Contrat inaccessible"); return; }
    if (tab) { tab.opener = null; tab.location.href = data.signedUrl; }
    else toast.error("Autorisez l’ouverture du document dans votre navigateur");
  }
  async function save() {
    if (busy) return;
    setErrorMessage("");
    setBusy(true);
    try {
      const fileName = contract ? await uploadReceipt(item.id, contract) : saved.contract_file;
      const existing = item.warranty_details && typeof item.warranty_details === "object" && !Array.isArray(item.warranty_details) ? item.warranty_details : {};
      const detail = { provider: draft.provider?.trim() || "", start_date: draft.start_date || "", conditions: draft.conditions?.trim() || "", ...(fileName ? { contract_file: fileName } : {}) };
      const { error } = await supabase.from("items").update({ warranty_details: { ...existing, [warrantyKey]: detail } }).eq("id", item.id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["items"] });
      await qc.invalidateQueries({ queryKey: ["receipts", item.id] });
      setContract(null); setOpen(false);
      toast.success("Informations de garantie enregistrées");
    } catch { setErrorMessage("Enregistrement impossible. Vos informations restent dans le formulaire."); toast.error("Enregistrement impossible. Vos informations restent dans le formulaire."); }
    finally { setBusy(false); }
  }
  return <div className="mt-3">
    {saved.contract_file && <Button size="sm" variant="outline" className="mb-2 min-h-11 w-full whitespace-normal" onClick={openContract}><FileText className="h-4 w-4 shrink-0" />Consulter le contrat</Button>}
    <Rubrique compact title="Modifier les informations" open={open} onOpenChange={(next) => { if (!busy) setOpen(next); }}>
      <fieldset disabled={busy} className="mt-3 min-w-0 space-y-3">
        <div className="space-y-1"><Label htmlFor={`${warrantyKey}-detail-provider`}>{warrantyKey === "repair" ? "Réparateur" : "Fournisseur"}</Label><Input id={`${warrantyKey}-detail-provider`} className="h-11" value={draft.provider || ""} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor={`${warrantyKey}-detail-start`}>{warrantyKey === "repair" ? "Date de réparation" : "Date de début"}</Label><Input id={`${warrantyKey}-detail-start`} type="date" className="h-11 min-w-0" value={draft.start_date || ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></div>
        <p className="text-xs text-muted-foreground">Sans date de début, la date d’achat est utilisée.</p>
        {previewEnd && <p className="text-sm font-medium" role="status">Fin prévue : {fmt(previewEnd)}</p>}
        <div className="space-y-1"><Label htmlFor={`${warrantyKey}-detail-conditions`}>{warrantyKey === "repair" ? "Description de l’intervention" : "Conditions particulières"}</Label><Textarea id={`${warrantyKey}-detail-conditions`} value={draft.conditions || ""} onChange={(e) => setDraft({ ...draft, conditions: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor={`${warrantyKey}-detail-file`}>Contrat ou facture (photo ou PDF)</Label><Input id={`${warrantyKey}-detail-file`} type="file" accept="image/*,application/pdf" className="h-11 min-w-0" onChange={(e) => setContract(e.target.files?.[0] ?? null)} /></div>
        {contract && <p className="break-all text-xs text-muted-foreground">{contract.name}</p>}
        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
        <div className="sticky bottom-0 space-y-2 border-t bg-card py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button className="h-auto min-h-11 w-full whitespace-normal" disabled={busy} onClick={save}>{busy ? "Enregistrement…" : "Enregistrer les informations"}</Button>
          <Button variant="outline" className="min-h-11 w-full" disabled={busy} onClick={cancel}>Annuler</Button>
        </div>
      </fieldset>
    </Rubrique>
  </div>;
}