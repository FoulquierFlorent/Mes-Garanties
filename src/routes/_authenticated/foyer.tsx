import { memberDotClass } from "@/lib/members";
import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { householdQuery } from "@/lib/items";
import { useUserId } from "@/hooks/useUserId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/foyer")({
  head: () => ({ meta: [{ title: "Mon foyer — Mes garanties" }, { name: "description", content: "Partagez vos garanties avec votre foyer." }, { property: "og:title", content: "Mon foyer — Mes garanties" }, { property: "og:description", content: "Partagez vos garanties avec les membres de votre maison." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(householdQuery),
  component: FoyerPage,
});

function FoyerPage() {
  const { data: h } = useSuspenseQuery(householdQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("Maison");
  const [code, setCode] = useState("");
  const me = useUserId();
  const mine = h?.members.find((m) => m.user_id === me);
  const [myName, setMyName] = useState("");
  useEffect(() => { setMyName(mine?.display_name ?? ""); }, [mine?.display_name, me]);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["household"] }); qc.invalidateQueries({ queryKey: ["items"] }); };

  async function saveName() {
    if (!h) return;
    const uid = me ?? (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    const { error } = await supabase.from("household_members").update({ display_name: myName.trim() }).eq("household_id", h.id).eq("user_id", uid);
    if (error) { toast.error("Enregistrement impossible"); return; }
    toast.success("Prénom enregistré");
    refresh();
  }
  async function saveColor(color: string) {
    if (!h || !me) return;
    const { error } = await supabase.from("household_members").update({ color }).eq("household_id", h.id).eq("user_id", me);
    if (error) { toast.error("Enregistrement impossible"); return; }
    refresh();
  }

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
        <RightBanner variant="whisper" offset={10} className="mt-3" />
        <div className="mt-8 rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Code d'invitation à partager</p>
          <p className="mt-2 font-serif text-5xl tracking-[0.2em] text-accent">{h.invite_code}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { navigator.clipboard.writeText(h.invite_code); toast.success("Code copié"); }}>Copier</Button>
        </div>
        <h2 className="mt-10 text-2xl">Membres</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {h.members.map((m) => {
            const frame = memberFrameColor(m.color, m.user_id);
            const n = m.display_name?.trim() || "Membre";
            const count = items.filter((i) => i.user_id === m.user_id).length;
            return (
              <Link key={m.user_id} to="/membre/$id" params={{ id: m.user_id }} className="relative flex aspect-square flex-col overflow-hidden rounded-3xl border-2 bg-card p-4 shadow-sm transition-transform hover:-translate-y-0.5" style={{ borderColor: frame }}>
                <span aria-hidden className="absolute inset-x-0 top-0 h-1.5" style={{ background: frame }} />
                <span className="grid h-11 w-11 place-items-center rounded-2xl font-serif text-xl" style={{ background: `color-mix(in oklab, ${frame} 18%, transparent)` }}>{n.charAt(0).toUpperCase()}</span>
                <span className="mt-auto truncate font-serif text-3xl leading-tight">{n}</span>
                <span className="text-xs text-muted-foreground">{count} objet{count > 1 ? "s" : ""}{m.user_id === me ? " · Vous" : ""}</span>
              </Link>
            );
          })}
        </div>

        {mine && (
          <section className="mt-6 rounded-lg border bg-card p-4">
            <Label htmlFor="my-name" className="text-xs text-muted-foreground">Votre prénom</Label>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Input id="my-name" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Prénom" className="max-w-48" />
              <Button size="sm" variant="outline" onClick={saveName}>Enregistrer</Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Couleur de votre encadré</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {FRAME_COLORS.map((c) => (
                <button key={c.key} type="button" aria-label={c.label} title={c.label} aria-pressed={mine.color === c.key} onClick={() => saveColor(c.key)}
                  className={`h-8 w-8 rounded-full border-2 ring-offset-2 ring-offset-background ${mine.color === c.key ? "ring-2 ring-ring" : ""}`} style={{ background: `var(--frame-${c.key})`, borderColor: "var(--border)" }} />
              ))}
            </div>
          </section>
        )}
        <Button variant="ghost" className="mt-6 text-destructive" onClick={leave}>Quitter le foyer</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <h1 className="text-4xl sm:text-5xl">Partager en famille</h1>
      <RightBanner variant="whisper" offset={2} className="mt-3" />
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
