import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type P = { email: string; relation: string; phone: string; birth_date: string; address: string; notes: string };
const EMPTY: P = { email: "", relation: "", phone: "", birth_date: "", address: "", notes: "" };

/** Espace secret : visible uniquement par la personne connectée. */
export function PrivateProfile({ userId }: { userId: string }) {
  const [p, setP] = useState<P>(EMPTY);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from("member_profiles").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) setP({ email: data.email ?? "", relation: data.relation ?? "", phone: data.phone ?? "", birth_date: data.birth_date ?? "", address: data.address ?? "", notes: data.notes ?? "" });
    });
  }, [userId]);
  const set = (k: keyof P) => (e: { target: { value: string } }) => setP({ ...p, [k]: e.target.value });
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.from("member_profiles").upsert({ user_id: userId, ...p, birth_date: p.birth_date || null, updated_at: new Date().toISOString() });
    setBusy(false);
    error ? toast.error("Enregistrement impossible") : toast.success("Espace secret enregistré");
  };
  return (
    <section className="mt-8 rounded-lg border bg-card p-5">
      <h2 className="flex items-center gap-2 text-2xl"><Lock className="h-5 w-5 text-accent" />Mon espace secret</h2>
      <p className="mt-1 text-sm text-muted-foreground">Visible uniquement par vous, pas par les autres membres du foyer.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="pp-email">E-mail</Label><Input id="pp-email" type="email" value={p.email} onChange={set("email")} /></div>
        <div className="space-y-1.5"><Label htmlFor="pp-rel">Lien familial</Label><Input id="pp-rel" placeholder="Père, fille, conjoint…" value={p.relation} onChange={set("relation")} /></div>
        <div className="space-y-1.5"><Label htmlFor="pp-phone">Téléphone</Label><Input id="pp-phone" type="tel" value={p.phone} onChange={set("phone")} /></div>
        <div className="space-y-1.5"><Label htmlFor="pp-birth">Date de naissance</Label><Input id="pp-birth" type="date" value={p.birth_date} onChange={set("birth_date")} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pp-addr">Adresse</Label><Input id="pp-addr" value={p.address} onChange={set("address")} /></div>
        <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="pp-notes">Autres renseignements</Label><Textarea id="pp-notes" rows={3} value={p.notes} onChange={set("notes")} /></div>
      </div>
      <Button className="mt-4" onClick={save} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</Button>
    </section>
  );
}
