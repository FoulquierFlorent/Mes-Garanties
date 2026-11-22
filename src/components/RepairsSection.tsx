import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmt } from "@/lib/items";
import { baseWarrantyEnd } from "@/lib/warranty";
import { adjustedLegalEnd, parseRepairs, partsWarrantyEnd, REPAIR_TYPES, type Repair, type RepairType } from "@/lib/repairs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RepairsSection({ item }: { item: any }) {
  const qc = useQueryClient();
  const repairs = parseRepairs(item.repairs);
  const empty: Repair = { id: "", type: "legal" };
  const [draft, setDraft] = useState<Repair | null>(null);
  const [saving, setSaving] = useState(false);
  const base = baseWarrantyEnd(item);
  const adjusted = adjustedLegalEnd(base, repairs);
  const set = (k: keyof Repair, v: string) => setDraft((d) => d && { ...d, [k]: k === "amount" || k === "partsWarrantyMonths" ? (v ? Number(v.replace(",", ".")) : undefined) : v || undefined });
  async function persist(next: Repair[]) {
    setSaving(true);
    const { error } = await supabase.from("items").update({ repairs: next as never }).eq("id", item.id);
    setSaving(false);
    if (error) { toast.error("Enregistrement impossible"); return; }
    await qc.invalidateQueries({ queryKey: ["items"] });
    setDraft(null);
    toast.success("Historique mis à jour");
  }
  const field = (k: keyof Repair, label: string, type = "date") => (
    <div><Label>{label}</Label><Input type={type} inputMode={type === "text" ? undefined : type === "number" ? "decimal" : undefined} value={(draft?.[k] as string | number | undefined) ?? ""} onChange={(e) => set(k, e.target.value)} /></div>
  );
  return (
    <div className="space-y-4">
      {base && adjusted && adjusted !== base && <p className="text-sm">Garantie légale de conformité prolongée jusqu’au <strong>{fmt(adjusted)}</strong> (au lieu du {fmt(base)}).</p>}
      {repairs.length === 0 && !draft && <p className="text-sm text-muted-foreground">Aucune intervention enregistrée.</p>}
      <ul className="space-y-2">
        {repairs.map((r) => (
          <li key={r.id} className="rounded-md border p-3 text-sm">
            <p className="font-medium">{REPAIR_TYPES[r.type]}</p>
            {r.problem && <p className="text-muted-foreground">{r.problem}</p>}
            <p className="text-muted-foreground">{[r.failureDate && `Panne ${fmt(r.failureDate)}`, r.returnDate && `Restitué ${fmt(r.returnDate)}`, r.repairer, r.amount != null && `${r.amount} €`].filter(Boolean).join(" · ")}</p>
            {partsWarrantyEnd(r) && <p className="text-muted-foreground">Garantie de la réparation jusqu’au {fmt(partsWarrantyEnd(r)!)}</p>}
            <div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => setDraft(r)}>Modifier</Button><Button size="sm" variant="ghost" disabled={saving} onClick={() => confirm("Supprimer cette intervention ?") && persist(repairs.filter((x) => x.id !== r.id))}>Supprimer</Button></div>
          </li>
        ))}
      </ul>
      {draft ? (
        <div className="space-y-3 rounded-md border p-3">
          <div><Label>Type d’intervention</Label>
            <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v as RepairType })}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(REPAIR_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Description du problème</Label><Textarea value={draft.problem ?? ""} onChange={(e) => set("problem", e.target.value)} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field("failureDate", "Date de la panne")}{field("requestDate", "Date de demande de réparation")}
            {field("dropDate", "Date de dépôt")}{field("returnDate", draft.type === "replacement" ? "Date de livraison du remplacement" : "Date de restitution")}
            {field("repairer", "Réparateur", "text")}{field("amount", "Montant payé (€)", "number")}
            {draft.type === "paid" && field("partsWarrantyMonths", "Garantie de la réparation (mois)", "number")}
          </div>
          <p className="text-xs text-muted-foreground">Ajoutez la facture de réparation dans « Factures, tickets et résumé ». Une réparation payante ne prolonge pas la garantie de l’appareil.</p>
          <div className="flex gap-2"><Button disabled={saving} onClick={() => persist(draft.id ? repairs.map((x) => (x.id === draft.id ? draft : x)) : [...repairs, { ...draft, id: crypto.randomUUID() }])}>Enregistrer</Button><Button variant="ghost" onClick={() => setDraft(null)}>Annuler</Button></div>
        </div>
      ) : <Button variant="outline" onClick={() => setDraft(empty)}>Ajouter une intervention</Button>}
    </div>
  );
}
