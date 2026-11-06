import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Invitation = {
  id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "revoked";
  created_at: string;
  last_sent_at: string | null;
};

export function FamilyInvitations({ householdId, plan }: { householdId: string; plan: string }) {
  const me = useUserId();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const key = ["household-invitations", householdId];
  const { data: invitations = [] } = useQuery({
    queryKey: key,
    enabled: plan === "famille",
    queryFn: async () => {
      const { data, error } = await supabase.from("household_invitations").select("id, email, token, status, created_at, last_sent_at").eq("household_id", householdId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invitation[];
    },
  });
  if (plan !== "famille") return null;

  async function sendEmail(address: string, token: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/invitation/${token}` },
    });
    if (error) throw error;
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    if (!me) return;
    const address = email.trim().toLowerCase();
    setBusy("new");
    try {
      const { data, error } = await supabase.from("household_invitations").insert({ household_id: householdId, email: address, invited_by: me, last_sent_at: new Date().toISOString() }).select("token").single();
      if (error) throw error;
      await sendEmail(address, data.token);
      setEmail("");
      toast.success("Invitation envoyée par e-mail");
      await qc.invalidateQueries({ queryKey: key });
    } catch {
      toast.error("Invitation non envoyée. Vérifiez l’adresse et réessayez.");
      await qc.invalidateQueries({ queryKey: key });
    } finally {
      setBusy(null);
    }
  }

  async function resend(invitation: Invitation) {
    setBusy(invitation.id);
    try {
      await sendEmail(invitation.email, invitation.token);
      const { error } = await supabase.from("household_invitations").update({ last_sent_at: new Date().toISOString(), expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }).eq("id", invitation.id);
      if (error) throw error;
      toast.success("Invitation renvoyée");
      await qc.invalidateQueries({ queryKey: key });
    } catch {
      toast.error("Le renvoi a échoué. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function revoke(invitation: Invitation) {
    setBusy(invitation.id);
    const { error } = await supabase.from("household_invitations").update({ status: "revoked" }).eq("id", invitation.id);
    if (error) toast.error("Révocation impossible");
    else {
      toast.success("Invitation révoquée");
      await qc.invalidateQueries({ queryKey: key });
    }
    setBusy(null);
  }

  return (
    <section className="mt-6 rounded-lg border bg-card p-6">
      <h2 className="text-2xl">Inviter par e-mail</h2>
      <p className="mt-1 text-sm text-muted-foreground">La personne recevra un lien sécurisé pour créer son compte ou se connecter, puis rejoindre ce foyer.</p>
      <form onSubmit={invite} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="family-invite-email">Adresse e-mail</Label>
          <Input id="family-invite-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nom@exemple.fr" />
        </div>
        <Button disabled={busy !== null}><Mail />{busy === "new" ? "Envoi…" : "Envoyer l’invitation"}</Button>
      </form>
      {invitations.length > 0 && (
        <ul className="mt-5 divide-y">
          {invitations.map((invitation) => (
            <li key={invitation.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
              <span className="min-w-0 flex-1 truncate">{invitation.email}</span>
              <span className="text-xs text-muted-foreground">{invitation.status === "pending" ? "En attente" : invitation.status === "accepted" ? "Acceptée" : "Révoquée"}</span>
              {invitation.status === "pending" && (
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" disabled={busy !== null} onClick={() => resend(invitation)}><RefreshCw />Renvoyer</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={busy !== null} onClick={() => revoke(invitation)}><X />Révoquer</Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
