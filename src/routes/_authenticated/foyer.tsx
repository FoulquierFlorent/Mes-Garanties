import { memberFrameColor, FRAME_COLORS } from "@/lib/members";
import { RightBanner } from "@/components/RightBanner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { householdQuery, itemsQuery, todayISO } from "@/lib/items";
import { itemWarranties, status } from "@/lib/warranty";
import { Bell, Check, Copy, CreditCard, KeyRound, Lock, Palette, Share2, Users } from "lucide-react";
import { StatTile, SettingRow } from "@/components/HouseholdUi";
import { PrivateProfile } from "@/components/PrivateProfile";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PLAN_LABELS, type PlanId } from "@/lib/plans";
import { useUserId } from "@/hooks/useUserId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FamilyInvitations } from "@/components/FamilyInvitations";
import { RemoveMember } from "@/components/RemoveMember";
import { EmailAlertPreferences } from "@/components/EmailAlertPreferences";
import { DeleteAccount } from "@/components/DeleteAccount";

export const Route = createFileRoute("/_authenticated/foyer")({
  head: () => ({ meta: [{ title: "Mon foyer — Mes garanties" }, { name: "description", content: "Partagez vos garanties avec votre foyer." }, { property: "og:title", content: "Mon foyer — Mes garanties" }, { property: "og:description", content: "Partagez vos garanties avec les membres de votre maison." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(householdQuery), context.queryClient.ensureQueryData(itemsQuery)]),
  component: FoyerPage,
});

function FoyerPage() {
  const { data: h } = useSuspenseQuery(householdQuery);
  const { data: items } = useSuspenseQuery(itemsQuery);
  const qc = useQueryClient();
  const [name, setName] = useState("Maison");
  const [code, setCode] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
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
    toast.success("Couleur enregistrée");
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
  async function savePlan(plan: PlanId) {
    if (!h) return;
    const { error } = await supabase.from("households").update({ plan }).eq("id", h.id);
    if (error) { toast.error("Enregistrement impossible"); return; }
    toast.success("Offre enregistrée");
    refresh();
  }

  async function leave() {
    const { data } = await supabase.auth.getUser();
    await supabase.from("household_members").delete().eq("household_id", h!.id).eq("user_id", data.user!.id);
    refresh();
  }

  if (h) {
    const today = todayISO();
    const hItems = items.filter((i) => i.household_id === h.id);
    const covered = hItems.filter((i) => itemWarranties(i).some((w) => status(w.end, today) !== "expired")).length;
    const toggle = (k: string) => setOpen(open === k ? null : k);
    const share = async () => {
      const text = `Rejoignez notre foyer « ${h.name} » sur Mes garanties avec le code ${h.invite_code}`;
      if (navigator.share) { try { await navigator.share({ title: "Mes garanties", text }); } catch { /* annulé */ } }
      else { await navigator.clipboard.writeText(text); toast.success("Message d'invitation copié"); }
    };
    return (
      <main className="mx-auto max-w-xl px-4 py-8 sm:px-5 sm:py-10">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-4xl sm:text-5xl">{h.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{h.members.length} membre{h.members.length > 1 ? "s" : ""}</p>
          </div>
          <Button variant="outline" className="h-11" aria-expanded={showCode} onClick={() => setShowCode(!showCode)}><KeyRound />Code</Button>
        </header>
        {showCode && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
            <p className="mr-auto font-serif text-3xl tracking-[0.2em] text-accent" aria-label={`Code d'invitation ${h.invite_code}`}>{h.invite_code}</p>
            <Button variant="outline" className="h-11" onClick={() => { navigator.clipboard.writeText(h.invite_code); toast.success("Code copié"); }}><Copy />Copier</Button>
            <Button className="h-11" onClick={share}><Share2 />Partager</Button>
          </div>
        )}
        <RightBanner variant="whisper" offset={10} className="mt-3" />

        <div className="mt-5 grid grid-cols-3 gap-2">
          <StatTile value={hItems.length} label={`objet${hItems.length > 1 ? "s" : ""}`} />
          <StatTile value={covered} label="encore couverts" />
          <StatTile value={h.members.length} label={`membre${h.members.length > 1 ? "s" : ""}`} />
        </div>

        <h2 className="mt-7 text-2xl">Membres</h2>
        <ul className="mt-3 grid grid-cols-2 gap-2.5">
          {h.members.map((m) => {
            const frame = memberFrameColor(m.color, m.user_id);
            const n = m.display_name?.trim() || "Membre";
            const count = items.filter((i) => i.user_id === m.user_id).length;
            const isMe = m.user_id === me;
            return (
              <li key={m.user_id}>
                <Link to="/membre/$id" params={{ id: m.user_id }} aria-label={`${n}${isMe ? " (vous)" : ""}, ${count} objet${count > 1 ? "s" : ""}`} className="flex min-h-16 items-center gap-2.5 rounded-2xl border-2 bg-card p-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ borderColor: frame }}>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-serif text-lg" style={{ background: `color-mix(in oklab, ${frame} 22%, transparent)` }}>{n.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-xl leading-tight">{n}</span>
                    <span className="block text-xs text-muted-foreground">{count} objet{count > 1 ? "s" : ""}{isMe ? " · Vous" : ""}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h2 className="mt-7 text-2xl">Paramètres</h2>
        <div className="mt-3 overflow-hidden rounded-xl border bg-card">
          <SettingRow icon={<Users />} title="Gérer les membres" hint={h.plan === "famille" ? "Invitations et retrait" : "Retrait d'un membre"} open={open === "members"} onToggle={() => toggle("members")}>
            {h.plan === "famille" && <FamilyInvitations householdId={h.id} plan={h.plan} />}
            {h.members.filter((m) => m.user_id !== me).length ? (
              <ul className="mt-3 divide-y rounded-lg border">
                {h.members.filter((m) => m.user_id !== me).map((m) => {
                  const n = m.display_name?.trim() || "Membre";
                  return <li key={m.user_id} className="flex items-center justify-between gap-2 px-3 py-1"><span className="truncate text-sm">{n}</span><RemoveMember householdId={h.id} userId={m.user_id} name={n} plan={h.plan} onRemoved={refresh} /></li>;
                })}
              </ul>
            ) : <p className="mt-2 text-sm text-muted-foreground">Vous êtes le seul membre pour l'instant. Partagez le code pour inviter quelqu'un.</p>}
          </SettingRow>
          {mine && (
            <SettingRow icon={<Bell />} title="Alertes de garantie" hint="Rappel par e-mail avant l'échéance" open={open === "alerts"} onToggle={() => toggle("alerts")}>
              <EmailAlertPreferences householdId={h.id} userId={mine.user_id} />
            </SettingRow>
          )}
          {mine && (
            <SettingRow icon={<Lock />} title="Mes informations privées" hint="Visibles par vous seul" open={open === "private"} onToggle={() => toggle("private")}>
              {mine.display_name?.trim() ? <PrivateProfile userId={mine.user_id} /> : <p className="text-sm text-muted-foreground">Enregistrez d'abord votre prénom dans « Personnalisation du profil ».</p>}
            </SettingRow>
          )}
          {mine && (
            <SettingRow icon={<Palette />} title="Personnalisation du profil" hint="Prénom et couleur" open={open === "profile"} onToggle={() => toggle("profile")}>
              <Label htmlFor="my-name">Votre prénom</Label>
              <div className="mt-1.5 flex gap-2">
                <Input id="my-name" value={myName} onChange={(e) => setMyName(e.target.value)} placeholder="Prénom" className="h-11 min-w-0 flex-1" />
                <Button variant="outline" className="h-11 shrink-0" onClick={saveName}>Enregistrer</Button>
              </div>
              <p id="color-label" className="mt-4 text-sm font-medium">Couleur de mon profil</p>
              <div role="radiogroup" aria-labelledby="color-label" className="mt-2 flex flex-wrap gap-2.5">
                {FRAME_COLORS.map((c) => {
                  const sel = mine.color === c.key;
                  return (
                    <button key={c.key} type="button" role="radio" aria-checked={sel} aria-label={c.label} title={c.label} onClick={() => saveColor(c.key)}
                      className={`grid h-11 w-11 place-items-center rounded-full border ring-offset-2 ring-offset-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${sel ? "ring-2 ring-foreground" : ""}`} style={{ background: `var(--frame-${c.key})`, borderColor: "var(--border)" }}>
                      {sel && <Check className="h-4 w-4 rounded-full bg-card p-0.5 text-foreground" />}
                    </button>
                  );
                })}
              </div>
            </SettingRow>
          )}
          <SettingRow icon={<CreditCard />} title="Offre et abonnement" hint={PLAN_LABELS[h.plan as PlanId]} open={open === "plan"} onToggle={() => toggle("plan")}>
            <Label htmlFor="household-plan">Offre du foyer</Label>
            <select id="household-plan" value={h.plan} onChange={(e) => savePlan(e.target.value as PlanId)} className="mt-1.5 h-11 w-full rounded-md border border-input bg-background px-3 text-sm">
              {(Object.keys(PLAN_LABELS) as PlanId[]).map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">Le dossier d'assurance est réservé aux offres Solo, Famille et Titane. <Link to="/tarifs" className="underline">Voir les tarifs</Link></p>
          </SettingRow>
        </div>

        <h2 className="mt-7 text-sm font-semibold uppercase tracking-wider text-destructive">Zone sensible</h2>
        <div className="mt-2 space-y-4 rounded-xl border border-destructive/30 bg-card p-4">
          <section>
            <h3 className="font-sans text-sm font-medium">Quitter le foyer</h3>
            <p className="mt-1 text-sm text-muted-foreground">Vous ne verrez plus les objets partagés de « {h.name} ».</p>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="outline" className="mt-3 h-11 border-destructive/50 text-destructive">Quitter le foyer</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Quitter « {h.name} » ?</AlertDialogTitle>
                  <AlertDialogDescription>Vous perdrez l'accès aux objets, garanties et justificatifs partagés par ce foyer. Les objets que vous y avez ajoutés restent visibles pour les autres membres. Pour revenir, il vous faudra un nouveau code d'invitation.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={leave}>Quitter le foyer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
          <div className="border-t pt-4">
            <DeleteAccount sharedItems={h.members.length > 1 ? items.filter((i) => i.user_id === me && i.household_id === h.id).length : 0} />
          </div>
        </div>
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
      <DeleteAccount sharedItems={0} />
    </main>
  );
}
