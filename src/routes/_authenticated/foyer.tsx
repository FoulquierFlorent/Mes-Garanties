import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { householdQuery } from "@/lib/items";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/foyer")({
  head: () => ({ meta: [{ title: "Mon foyer — Garantia" }, { name: "description", content: "Partagez vos garanties avec votre foyer." }, { property: "og:title", content: "Mon foyer — Garantia" }, { property: "og:description", content: "Partagez vos garanties avec les membres de votre maison." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(householdQuery),
  component: FoyerPage,
});

function FoyerPage() {
  const { data: h } = useSuspenseQuery(householdQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("Maison");
  const [code, setCode] = useState("");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["household"] }); qc.invalidateQueries({ queryKey: ["items"] }); };

  async function create() {
    const { error } = await supabase.rpc("create_household", { _name: name });
    if (error) { toast.error("Création impossible"); return; }
    toast.success("Foyer créé"); refresh();
  }
  async function join() {
    const { error } = await supabase.rpc("join_household", { _code: code });
    if (error) { toast.error("Code invalide"); return; }
    toast.success("Vous avez rejoint le foyer"); refresh();
  }
  async function leave() {
    const { data } = await supabase.auth.getUser();
    await supabase.from("household_members").delete().eq("household_id", h!.id).eq("user_id", data.user!.id);
    refresh();
  }

  if (h) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <h1 className="text-4xl sm:text-5xl">{h.name}</h1>
        <div className="mt-8 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Code d'invitation à partager</p>
          <p className="mt-2 font-serif text-5xl tracking-[0.2em] text-accent">{h.invite_code}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { navigator.clipboard.writeText(h.invite_code); toast.success("Code copié"); }}>Copier</Button>
        </div>
        <h2 className="mt-10 text-2xl">Membres</h2>
        <ul className="mt-3 divide-y rounded-lg border bg-card">
          {h.members.map((m) => <li key={m.user_id} className="p-3 text-sm">{m.email ?? "Membre"}</li>)}
        </ul>
        <Button variant="ghost" className="mt-6 text-destructive" onClick={leave}>Quitter le foyer</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-4xl sm:text-5xl">Partager en famille</h1>
      <p className="mt-3 text-muted-foreground">Créez un foyer et invitez les personnes de votre maison : tout le monde voit et gère les mêmes objets.</p>
      <div className="mt-8 space-y-3 rounded-lg border bg-card p-6">
        <Label>Nom du foyer</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Button className="w-full" onClick={create}>Créer mon foyer</Button>
      </div>
      <div className="mt-6 space-y-3 rounded-lg border bg-card p-6">
        <Label>Rejoindre avec un code</Label>
        <Input placeholder="AB12CD" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button variant="outline" className="w-full" onClick={join}>Rejoindre</Button>
      </div>
    </main>
  );
}
